import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';

const source = readFileSync(new URL('../gtd-adventure-workbench-v8.html', import.meta.url), 'utf8');
const storageKey = 'gtd-adventure-workbench-v8-state';

// DOM-only tests. No browser/network access, screenshot, or layout measurement.
// Native dialog focus trapping and viewport fit still require visual/browser QA.
function mount(t, { saved, failRead = false, failWrite = false, hash = '' } = {}) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(source, {
    url: 'https://prototype.test/' + hash,
    runScripts: 'dangerously',
    virtualConsole,
    beforeParse(window) {
      window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
      window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
      if (saved !== undefined) window.localStorage.setItem(storageKey, saved);
      if (failRead) window.Storage.prototype.getItem = () => { throw new Error('read unavailable'); };
      if (failWrite) window.Storage.prototype.setItem = () => { throw new Error('quota exceeded'); };
    },
  });
  t.after(() => { assert.deepEqual(errors, []); dom.window.close(); });
  const d = dom.window.document;
  return {
    window: dom.window, d,
    el: id => d.getElementById(id),
    click: selector => { const el = d.querySelector(selector); assert.ok(el, selector); el.click(); },
    change: (id, value) => { const el = d.getElementById(id); el.value = value; el.dispatchEvent(new dom.window.Event('change')); },
    input: (id, value) => { const el = d.getElementById(id); el.value = value; el.dispatchEvent(new dom.window.Event('input')); },
    submit: id => d.getElementById(id).dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })),
    readSaved: () => JSON.parse(dom.window.localStorage.getItem(storageKey)),
  };
}

test('self-contained source parses, has unique IDs, and preserves the approved palette', t => {
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.doesNotThrow(() => new vm.Script(script));
  const { d } = mount(t);
  const ids = [...d.querySelectorAll('[id]')].map(el => el.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(d.querySelectorAll('script[src],link[rel="stylesheet"],img[src^="http"]').length, 0);
  for (const color of ['#243862', '#47669c', '#fffdf5', '#c79b42', '#eed286']) assert.ok(source.includes(color));
  for (const term of ['航海', '航标', '母港', '船舱', '停泊', '扬帆']) assert.ok(!d.body.textContent.includes(term));
  assert.ok(source.includes('@media (max-width:767px)'));
  assert.ok(source.includes('@media (prefers-reduced-motion:reduce)'));
  assert.ok(d.querySelector('dialog[aria-labelledby][aria-describedby]'));
});

test('initial state uses three next actions and one separate scheduled item, with no fake history', t => {
  const { el, d } = mount(t);
  assert.equal(el('actionTitle').textContent, '把手机充电器移到客厅');
  assert.equal(el('nextCount').textContent, '3');
  assert.equal(el('calendarCount').textContent, '1');
  assert.equal(el('doneCount').textContent, '0');
  assert.equal(d.querySelectorAll('.quest-item').length, 3);
  assert.equal(el('historyList').children.length, 0);
  assert.equal(el('historyEmpty').hidden, false);
  assert.equal(d.querySelectorAll('.journey button[role="tab"]').length, 5, 'all five stages are real page tabs');
});

test('selection changes the action, purpose, goal, project, context and energy together', t => {
  const { el, click } = mount(t);
  click('[data-quest="portfolio"]');
  assert.equal(el('actionTitle').textContent, '在纸上列出首页的三个核心案例');
  assert.match(el('purposeText').textContent, /作品/);
  assert.equal(el('projectText').textContent, '完成个人作品集改版');
  assert.match(el('goalText').textContent, /作品集/);
  assert.equal(el('contextValue').textContent, '书桌前');
  assert.equal(el('energyValue').textContent, '高');
  click('[data-quest="parents"]');
  assert.equal(el('goalText').textContent, '未关联阶段目标');
  assert.equal(el('projectText').textContent, '独立行动，无需额外项目');
  assert.match(el('purposeText').textContent, /家人/);
});

test('context filter keeps list and selected detail in agreement', t => {
  const { el, d, change } = mount(t);
  change('contextFilter', '书桌前');
  assert.equal(d.querySelectorAll('.quest-item').length, 1);
  assert.match(el('actionTitle').textContent, /三个核心案例/);
  change('contextFilter', 'all');
  assert.equal(d.querySelectorAll('.quest-item').length, 3);
});

test('completion, counts, history and persistence agree; returning to a task does not reset it', t => {
  const { el, click, readSaved } = mount(t);
  click('#completeButton');
  assert.equal(el('completionDialog').open, true);
  assert.equal(el('doneCount').textContent, '1');
  assert.equal(el('nextCount').textContent, '2');
  assert.equal(el('ledgerNext').textContent, '2');
  assert.equal(el('historyList').children.length, 1);
  assert.ok(readSaved().done.sleep);
  assert.match(el('receiptProject').textContent, /项目未被自动完成/);
  click('#continueButton');
  assert.match(el('actionTitle').textContent, /三个核心案例/);
  click('[data-list="done"]');
  assert.equal(el('actionTitle').textContent, '把手机充电器移到客厅');
  assert.equal(el('completeButton').textContent, '恢复到原清单');
});

test('undo restores the original action and leaves an accurate change record', t => {
  const { el, click, readSaved } = mount(t);
  click('#completeButton'); click('#undoButton');
  assert.equal(el('completionDialog').open, false);
  assert.equal(el('doneCount').textContent, '0');
  assert.equal(el('nextCount').textContent, '3');
  assert.equal(el('actionTitle').textContent, '把手机充电器移到客厅');
  assert.equal(el('completeButton').textContent, '完成这一步');
  assert.deepEqual(readSaved().done, {});
  assert.deepEqual(readSaved().events.map(e => e.type), ['complete', 'restore']);
});

test('restore from Done is distinct from completion and cannot duplicate a completion', t => {
  const { el, click, readSaved } = mount(t);
  click('#completeButton'); click('#viewDoneButton'); click('#completeButton');
  assert.equal(el('doneCount').textContent, '0');
  assert.equal(el('historyList').children.length, 2);
  assert.deepEqual(readSaved().events.map(e => e.type), ['complete', 'restore']);
});

test('calendar appointment remains literal and restores to Calendar rather than Next Actions', t => {
  const { el, click } = mount(t);
  click('#appointmentButton');
  assert.equal(el('actionTitle').textContent, '牙医复诊');
  assert.equal(el('timeValue').textContent, '9 月 3 日 18:30');
  assert.equal(el('filterRow').hidden, true);
  assert.equal(el('completeButton').textContent, '标记约定完成');
  click('#completeButton');
  assert.equal(el('calendarCount').textContent, '0');
  assert.equal(el('appointmentSection').hidden, true);
  click('#undoButton');
  assert.equal(el('calendarCount').textContent, '1');
  assert.equal(el('nextCount').textContent, '3');
  assert.equal(el('appointmentSection').hidden, false);
  assert.match(el('listCaption').textContent, /^日程表/);
});

test('refresh rehydrates local prototype state and never claims a production save', t => {
  const first = mount(t); first.click('#completeButton');
  const second = mount(t, { saved: JSON.stringify(first.readSaved()) });
  assert.equal(second.el('doneCount').textContent, '1');
  assert.equal(second.el('nextCount').textContent, '2');
  assert.match(second.el('storageStatus').textContent, /已载入本地原型记录/);
  second.click('[data-list="done"]');
  assert.equal(second.el('actionTitle').textContent, '把手机充电器移到客厅');
});

test('malformed or unknown local records are not overwritten', t => {
  for (const saved of ['{broken', JSON.stringify({version:1,done:{unknown:'2026-09-03T00:00:00Z'},events:[]})]) {
    const app = mount(t, { saved });
    assert.match(app.el('storageStatus').textContent, /不覆盖旧记录/);
    app.click('#completeButton');
    assert.equal(app.window.localStorage.getItem(storageKey), saved);
    assert.match(app.el('receiptStorage').textContent, /仅本次页面有效/);
  }
});

test('blocked storage and quota failure remain visibly transient without false save claims', t => {
  const blocked = mount(t, { failRead: true }); blocked.click('#completeButton');
  assert.match(blocked.el('receiptStorage').textContent, /仅本次页面有效/);
  const quota = mount(t, { failWrite: true }); quota.click('#completeButton');
  assert.match(quota.el('storageStatus').textContent, /未能保存/);
  assert.match(quota.el('receiptStorage').textContent, /刷新会丢失更改/);
  assert.equal(quota.el('doneCount').textContent, '1');
});

test('all completed and filtered-empty states have a recovery path', t => {
  const { el, click, change } = mount(t);
  change('contextFilter', '家中'); click('#completeButton'); click('#continueButton');
  change('contextFilter', '家中');
  assert.equal(el('emptyStage').hidden, false);
  assert.equal(el('questScroll').hidden, true);
  click('#emptyButton');
  assert.equal(el('emptyStage').hidden, true);
  click('#completeButton'); click('#continueButton');
  click('#completeButton'); click('#continueButton');
  assert.equal(el('nextCount').textContent, '0');
  assert.equal(el('emptyButton').textContent, '查看完成记录');
  click('#emptyButton');
  assert.equal(el('doneCount').textContent, '3');
  assert.equal(el('questScroll').hidden, false);
});

test('empty Done state can return to next actions', t => {
  const { el, click } = mount(t);
  click('[data-list="done"]');
  assert.equal(el('emptyTitle').textContent, '还没有完成记录');
  assert.equal(el('selectedContent').hidden, true);
  click('#emptyButton'); assert.equal(el('emptyStage').hidden, true);
});

test('Escape closes receipt and returns to a usable completion record', t => {
  const { el, click, d, window } = mount(t);
  click('#completeButton');
  el('completionDialog').dispatchEvent(new window.Event('cancel', { cancelable: true }));
  assert.equal(el('completionDialog').open, false);
  assert.equal(d.activeElement, el('completeButton'));
  assert.equal(el('completeButton').textContent, '恢复到原清单');
});

test('mobile navigation switches real panels, and the GTD overlay toggle preserves data', t => {
  const { click, el, d } = mount(t);
  for (const panel of ['list','journal','action']) {
    click(`[data-mobile="${panel}"]`);
    assert.equal(d.querySelector('[data-panel].mobile-active').dataset.panel, panel);
    assert.equal(d.querySelectorAll('[data-panel].mobile-active').length, 1);
  }
  click('#mappingButton'); assert.ok(d.body.classList.contains('hide-gtd'));
  click('#mappingButton'); assert.ok(!d.body.classList.contains('hide-gtd'));
  assert.equal(el('nextCount').textContent, '3');
});

test('all five top tabs switch the actual panel, accessibility state, and mobile sub-navigation', t => {
  const { click, el, d } = mount(t);
  for (const name of ['capture','clarify','organize','review','engage']) {
    click('#tab-' + name);
    assert.equal(el('stage-' + name).hidden, false);
    assert.equal(d.querySelectorAll('[role="tabpanel"]:not([hidden])').length, 1);
    assert.equal(d.querySelector('[role="tab"][aria-selected="true"]').id, 'tab-' + name);
    assert.equal(d.querySelectorAll('[role="tab"][tabindex="0"]').length, 1);
    assert.equal(d.querySelector('.mobile-nav').hidden, name !== 'engage');
  }
  assert.ok(!source.includes('.journey { display: none; }'), 'top-level navigation remains available on mobile');
});

test('tab arrows, Home and End activate the correct panel and retain keyboard focus', t => {
  const { el, d, window } = mount(t);
  el('tab-engage').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(d.activeElement, el('tab-capture'));
  assert.equal(el('stage-capture').hidden, false);
  el('tab-capture').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.equal(d.activeElement, el('tab-engage'));
  el('tab-engage').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.equal(d.activeElement, el('tab-capture'));
  el('tab-capture').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  assert.equal(d.activeElement, el('tab-engage'));
});

test('URL fragments open or restore the requested stage', t => {
  const { el, window } = mount(t, { hash: '#capture' });
  assert.equal(el('stage-capture').hidden, false);
  window.location.hash = 'review';
  window.dispatchEvent(new window.Event('hashchange'));
  assert.equal(el('stage-review').hidden, false);
  window.location.hash = 'unknown';
  window.dispatchEvent(new window.Event('hashchange'));
  assert.equal(el('stage-engage').hidden, false);
});

test('capture draft survives tab switches and refresh, while blank capture creates nothing', t => {
  const app = mount(t);
  app.click('#tab-capture'); app.input('captureText','  '); app.submit('captureForm');
  assert.equal(app.readSaved().items.length, 0);
  assert.ok(app.el('captureFeedback').classList.contains('error'));
  app.input('captureText','约一次自行车保养'); app.input('captureNote','先看看周末的时间');
  app.click('#tab-review'); app.click('#tab-capture');
  assert.equal(app.el('captureText').value,'约一次自行车保养');
  const refreshed = mount(t, { saved: JSON.stringify(app.readSaved()), hash: '#capture' });
  assert.equal(refreshed.el('captureText').value,'约一次自行车保养');
  assert.equal(refreshed.el('captureNote').value,'先看看周末的时间');
});

function capture(app, title = '约一次自行车保养', note = '周末有空') {
  app.click('#tab-capture'); app.input('captureText',title); app.input('captureNote',note); app.submit('captureForm');
  return app.readSaved()?.items.at(-1)?.id;
}

test('capture -> clarify -> organize -> engage -> complete -> undo is one shared record', t => {
  const app = mount(t); const id = capture(app);
  assert.equal(app.el('captureText').value,'');
  assert.equal(app.readSaved().items[0].list,'inbox');
  app.click('#tab-clarify');
  assert.equal(app.el('clarifyText').value,'约一次自行车保养');
  app.input('clarifyText','给车店打电话，确认周末保养时间'); app.change('clarifyContext','可通话处'); app.submit('clarifyForm');
  assert.equal(app.readSaved().items[0].id,id);
  assert.equal(app.readSaved().items[0].list,'next');
  assert.equal(app.el('nextCount').textContent,'4');
  assert.equal(app.el('stage-organize').hidden,false);
  assert.match(app.el('organizeRows').textContent,/给车店打电话/);
  app.click('#tab-engage'); app.click(`[data-quest="${id}"]`);
  assert.equal(app.el('contextValue').textContent,'可通话处');
  assert.equal(app.el('purposeText').textContent,'尚未关联目的，保留你的判断。');
  app.click('#completeButton');
  assert.ok(app.readSaved().done[id]); assert.equal(app.el('nextCount').textContent,'3');
  app.click('#undoButton');
  assert.equal(app.el('nextCount').textContent,'4'); assert.equal(app.readSaved().done[id],undefined);
  assert.equal(app.readSaved().items.length,1);
});

test('waiting, someday and reference are excluded from actionable work and can return to Inbox', t => {
  for (const destination of ['waiting','someday','reference']) {
    const app = mount(t); capture(app,'同事发来的材料'); app.click('#tab-clarify');
    app.change('clarifyDestination',destination);
    assert.equal(app.el('clarifyContextRow').hidden,true);
    app.submit('clarifyForm');
    assert.equal(app.el('nextCount').textContent,'3');
    assert.equal(app.readSaved().items[0].list,destination);
    assert.equal(app.el('organizeRows').querySelectorAll('li').length,1);
    app.click('#organizeRows button');
    assert.equal(app.readSaved().items[0].list,'inbox');
    app.click('#tab-clarify');
    assert.equal(app.el('clarifyText').value,'同事发来的材料');
  }
});

test('clarify drafts survive both stage navigation and queue selection, without changing saved items', t => {
  const app = mount(t); const first = capture(app,'第一件事'); const second = capture(app,'第二件事');
  app.click('#tab-clarify'); app.input('clarifyText','第一件事的新表达'); app.change('clarifyDestination','reference');
  app.click('#tab-capture'); app.click('#tab-clarify');
  assert.equal(app.el('clarifyText').value,'第一件事的新表达');
  app.click(`#clarifyQueue [data-inbox-id="${second}"]`); assert.equal(app.el('clarifyText').value,'第二件事');
  app.click(`#clarifyQueue [data-inbox-id="${first}"]`);
  assert.equal(app.el('clarifyText').value,'第一件事的新表达');
  assert.equal(app.el('clarifyDestination').value,'reference');
  assert.equal(app.readSaved().items[0].title,'第一件事');
});

test('new completed records reload alongside the original v8 completion history', t => {
  const legacy = JSON.stringify({version:1,done:{sleep:'2026-09-03T08:00:00.000Z'},events:[{id:'sleep',type:'complete',at:'2026-09-03T08:00:00.000Z'}]});
  const app = mount(t, { saved: legacy }); assert.equal(app.el('doneCount').textContent,'1');
  const id = capture(app); app.click('#tab-clarify'); app.submit('clarifyForm');
  app.click('#tab-engage'); app.click(`[data-quest="${id}"]`); app.click('#completeButton');
  const refreshed = mount(t, { saved: JSON.stringify(app.readSaved()) });
  assert.equal(refreshed.el('doneCount').textContent,'2');
  refreshed.click('[data-list="done"]'); refreshed.click(`[data-quest="${id}"]`);
  assert.equal(refreshed.el('actionTitle').textContent,'约一次自行车保养');
  assert.equal(refreshed.el('completeButton').textContent,'恢复到原清单');
});

test('switching away from Engage preserves its selected action, context and completion state', t => {
  const app = mount(t); app.change('contextFilter','书桌前');
  for (const name of ['capture','organize','review','engage']) app.click('#tab-'+name);
  assert.equal(app.el('contextFilter').value,'书桌前');
  assert.match(app.el('actionTitle').textContent,/三个核心案例/);
});

test('review notes and navigation work without inventing a weekly review completion', t => {
  const app = mount(t); app.click('#tab-review'); app.input('reviewNote','下周先调整睡前安排');
  app.click('#tab-engage'); app.click('#tab-review'); assert.equal(app.el('reviewNote').value,'下周先调整睡前安排');
  app.submit('reviewForm');
  assert.equal(app.readSaved().reviewNote,'下周先调整睡前安排');
  assert.deepEqual(app.readSaved().events,[]); assert.deepEqual(app.readSaved().done,{});
  assert.match(app.el('reviewFeedback').textContent,/不生成每周回顾完成记录/);
  const refreshed = mount(t, {saved:JSON.stringify(app.readSaved()),hash:'#review'});
  assert.equal(refreshed.el('reviewNote').value,'下周先调整睡前安排');
  app.click('#reviewDoneButton'); assert.equal(app.el('stage-engage').hidden,false);
  assert.equal(app.el('emptyTitle').textContent,'还没有完成记录');
  app.click('#tab-review'); app.click('#reviewActionsButton'); assert.equal(app.el('nextCount').textContent,'3');
});

test('user content is rendered literally rather than interpreted as HTML', t => {
  const app = mount(t); capture(app,'<img src=x onerror=alert(1)>','<script>danger()</script>');
  assert.equal(app.el('captureRecent').querySelector('img'),null);
  assert.match(app.el('captureRecent').textContent,/<img src=x/);
  app.click('#tab-clarify'); app.change('clarifyDestination','reference'); app.submit('clarifyForm');
  assert.equal(app.el('organizeRows').querySelector('script'),null);
  assert.match(app.el('organizeRows').textContent,/<script>danger/);
});

test('storage failures stay visible on every new page and do not block navigation', t => {
  const app = mount(t, { failWrite: true });
  app.click('#tab-capture'); app.input('captureText','仅在当前页面的一件事'); app.submit('captureForm');
  assert.match(app.el('captureFeedback').textContent,/未能保存/);
  app.click('#tab-clarify'); assert.equal(app.el('clarifyText').value,'仅在当前页面的一件事');
  app.submit('clarifyForm');
  assert.match(app.el('organizeFeedback').textContent,/未能保存/);
  assert.equal(app.el('nextCount').textContent,'4');
  for (const el of app.d.querySelectorAll('[data-storage-status]')) assert.match(el.textContent,/刷新会丢失更改/);
});
