# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: datagrid-prototype.spec.ts >> DataGrid 原型：列宽更新延迟在预算内，按住不动不计入渲染耗时
- Location: e2e/datagrid-prototype.spec.ts:90:1

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 64
Received:   73.2
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: 性能原型
      - heading "DataGrid 性能原型" [level=1] [ref=e7]
    - link "← 返回组件文档" [ref=e8] [cursor=pointer]:
      - /url: "#/components/virtual-table"
  - paragraph [ref=e9]: 10,000 行 × 9 列；验证虚拟化渲染、排序、选择、列宽拖动与固定列（RFC-005 立项前置）。本页是一次性测量脚手架，不进入组件库。
  - region "性能指标" [ref=e10]:
    - generic [ref=e11]: 渲染行数 24 / 10000
    - generic [ref=e12]: DOM 节点 300
    - generic [ref=e13]: 已选 0
    - generic [ref=e14]: 排序耗时 —
    - generic [ref=e15]: 选择耗时 —
    - generic [ref=e16]: 列宽更新延迟 73.2ms
  - grid "性能原型表格" [ref=e17]:
    - row [ref=e18]:
      - columnheader "全选" [ref=e19]:
        - checkbox "全选" [ref=e20]
      - columnheader "ID 调整 ID 列宽" [ref=e21]:
        - button "ID" [ref=e22] [cursor=pointer]:
          - text: ID
          - generic [aria-hidden] [ref=e23]: ↑
        - separator "调整 ID 列宽" [ref=e24]
      - columnheader "名称 调整 名称 列宽" [ref=e25]:
        - button "名称" [ref=e26] [cursor=pointer]:
          - text: 名称
          - generic [aria-hidden] [ref=e27]: ↕
        - separator "调整 名称 列宽" [ref=e28]
      - columnheader "区域 调整 区域 列宽" [ref=e29]:
        - button "区域" [ref=e30] [cursor=pointer]:
          - text: 区域
          - generic [aria-hidden] [ref=e31]: ↕
        - separator "调整 区域 列宽" [ref=e32]
      - columnheader "负责人 调整 负责人 列宽" [ref=e33]:
        - button "负责人" [ref=e34] [cursor=pointer]:
          - text: 负责人
          - generic [aria-hidden] [ref=e35]: ↕
        - separator "调整 负责人 列宽" [ref=e36]
      - columnheader "金额 调整 金额 列宽" [ref=e37]:
        - button "金额" [ref=e38] [cursor=pointer]:
          - text: 金额
          - generic [aria-hidden] [ref=e39]: ↕
        - separator "调整 金额 列宽" [ref=e40]
      - columnheader "状态 调整 状态 列宽" [ref=e41]:
        - text: 状态
        - separator "调整 状态 列宽" [ref=e42]
      - columnheader "进度 调整 进度 列宽" [ref=e43]:
        - button "进度" [ref=e44] [cursor=pointer]:
          - text: 进度
          - generic [aria-hidden] [ref=e45]: ↕
        - separator "调整 进度 列宽" [ref=e46]
      - columnheader "更新时间 调整 更新时间 列宽" [ref=e47]:
        - button "更新时间" [ref=e48] [cursor=pointer]:
          - text: 更新时间
          - generic [aria-hidden] [ref=e49]: ↕
        - separator "调整 更新时间 列宽" [ref=e50]
    - generic [ref=e53]:
      - row [ref=e54]:
        - gridcell [ref=e55]:
          - checkbox "选择 工单 1" [ref=e56]
        - gridcell "100000" [ref=e57]
        - gridcell "工单 1" [ref=e58]
        - gridcell "华南" [ref=e59]
        - gridcell "王一舟" [ref=e60]
        - gridcell "¥9,149.3" [ref=e61]
        - gridcell "archived" [ref=e62]
        - gridcell "76%" [ref=e63]
        - gridcell "2025-11-02" [ref=e64]
      - row [ref=e65]:
        - gridcell [ref=e66]:
          - checkbox "选择 工单 2" [ref=e67]
        - gridcell "100001" [ref=e68]
        - gridcell "工单 2" [ref=e69]
        - gridcell "华南" [ref=e70]
        - gridcell "林晓" [ref=e71]
        - gridcell "¥490.6" [ref=e72]
        - gridcell "active" [ref=e73]
        - gridcell "29%" [ref=e74]
        - gridcell "2025-11-13" [ref=e75]
      - row [ref=e76]:
        - gridcell [ref=e77]:
          - checkbox "选择 工单 3" [ref=e78]
        - gridcell "100002" [ref=e79]
        - gridcell "工单 3" [ref=e80]
        - gridcell "华南" [ref=e81]
        - gridcell "赵青禾" [ref=e82]
        - gridcell "¥3,618.8" [ref=e83]
        - gridcell "active" [ref=e84]
        - gridcell "10%" [ref=e85]
        - gridcell "2025-11-09" [ref=e86]
      - row [ref=e87]:
        - gridcell [ref=e88]:
          - checkbox "选择 工单 4" [ref=e89]
        - gridcell "100003" [ref=e90]
        - gridcell "工单 4" [ref=e91]
        - gridcell "西南" [ref=e92]
        - gridcell "孙砚" [ref=e93]
        - gridcell "¥4,512.1" [ref=e94]
        - gridcell "active" [ref=e95]
        - gridcell "84%" [ref=e96]
        - gridcell "2025-10-11" [ref=e97]
      - row [ref=e98]:
        - gridcell [ref=e99]:
          - checkbox "选择 工单 5" [ref=e100]
        - gridcell "100004" [ref=e101]
        - gridcell "工单 5" [ref=e102]
        - gridcell "西南" [ref=e103]
        - gridcell "孙砚" [ref=e104]
        - gridcell "¥8,050.1" [ref=e105]
        - gridcell "active" [ref=e106]
        - gridcell "34%" [ref=e107]
        - gridcell "2025-11-01" [ref=e108]
      - row [ref=e109]:
        - gridcell [ref=e110]:
          - checkbox "选择 工单 6" [ref=e111]
        - gridcell "100005" [ref=e112]
        - gridcell "工单 6" [ref=e113]
        - gridcell "华东" [ref=e114]
        - gridcell "陈默" [ref=e115]
        - gridcell "¥5,049.5" [ref=e116]
        - gridcell "archived" [ref=e117]
        - gridcell "27%" [ref=e118]
        - gridcell "2025-10-27" [ref=e119]
      - row [ref=e120]:
        - gridcell [ref=e121]:
          - checkbox "选择 工单 7" [ref=e122]
        - gridcell "100006" [ref=e123]
        - gridcell "工单 7" [ref=e124]
        - gridcell "华东" [ref=e125]
        - gridcell "王一舟" [ref=e126]
        - gridcell "¥5,551.4" [ref=e127]
        - gridcell "paused" [ref=e128]
        - gridcell "70%" [ref=e129]
        - gridcell "2025-11-08" [ref=e130]
      - row [ref=e131]:
        - gridcell [ref=e132]:
          - checkbox "选择 工单 8" [ref=e133]
        - gridcell "100007" [ref=e134]
        - gridcell "工单 8" [ref=e135]
        - gridcell "西南" [ref=e136]
        - gridcell "陈默" [ref=e137]
        - gridcell "¥8,359.3" [ref=e138]
        - gridcell "paused" [ref=e139]
        - gridcell "92%" [ref=e140]
        - gridcell "2025-10-14" [ref=e141]
      - row [ref=e142]:
        - gridcell [ref=e143]:
          - checkbox "选择 工单 9" [ref=e144]
        - gridcell "100008" [ref=e145]
        - gridcell "工单 9" [ref=e146]
        - gridcell "西南" [ref=e147]
        - gridcell "陈默" [ref=e148]
        - gridcell "¥175.9" [ref=e149]
        - gridcell "paused" [ref=e150]
        - gridcell "2%" [ref=e151]
        - gridcell "2025-10-15" [ref=e152]
      - row [ref=e153]:
        - gridcell [ref=e154]:
          - checkbox "选择 工单 10" [ref=e155]
        - gridcell "100009" [ref=e156]
        - gridcell "工单 10" [ref=e157]
        - gridcell "西南" [ref=e158]
        - gridcell "陈默" [ref=e159]
        - gridcell "¥3,254.7" [ref=e160]
        - gridcell "paused" [ref=e161]
        - gridcell "74%" [ref=e162]
        - gridcell "2025-10-30" [ref=e163]
      - row [ref=e164]:
        - gridcell [ref=e165]:
          - checkbox "选择 工单 11" [ref=e166]
        - gridcell "100010" [ref=e167]
        - gridcell "工单 11" [ref=e168]
        - gridcell "西南" [ref=e169]
        - gridcell "赵青禾" [ref=e170]
        - gridcell "¥6,200.1" [ref=e171]
        - gridcell "active" [ref=e172]
        - gridcell "27%" [ref=e173]
        - gridcell "2025-10-12" [ref=e174]
      - row [ref=e175]:
        - gridcell [ref=e176]:
          - checkbox "选择 工单 12" [ref=e177]
        - gridcell "100011" [ref=e178]
        - gridcell "工单 12" [ref=e179]
        - gridcell "西南" [ref=e180]
        - gridcell "孙砚" [ref=e181]
        - gridcell "¥2,391.5" [ref=e182]
        - gridcell "archived" [ref=e183]
        - gridcell "22%" [ref=e184]
        - gridcell "2025-10-24" [ref=e185]
      - row [ref=e186]:
        - gridcell [ref=e187]:
          - checkbox "选择 工单 13" [ref=e188]
        - gridcell "100012" [ref=e189]
        - gridcell "工单 13" [ref=e190]
        - gridcell "华东" [ref=e191]
        - gridcell "林晓" [ref=e192]
        - gridcell "¥1,469.4" [ref=e193]
        - gridcell "paused" [ref=e194]
        - gridcell "54%" [ref=e195]
        - gridcell "2025-11-13" [ref=e196]
      - row [ref=e197]:
        - gridcell [ref=e198]:
          - checkbox "选择 工单 14" [ref=e199]
        - gridcell "100013" [ref=e200]
        - gridcell "工单 14" [ref=e201]
        - gridcell "华北" [ref=e202]
        - gridcell "陈默" [ref=e203]
        - gridcell "¥3,549.3" [ref=e204]
        - gridcell "paused" [ref=e205]
        - gridcell "41%" [ref=e206]
        - gridcell "2025-10-10" [ref=e207]
      - row [ref=e208]:
        - gridcell [ref=e209]:
          - checkbox "选择 工单 15" [ref=e210]
        - gridcell "100014" [ref=e211]
        - gridcell "工单 15" [ref=e212]
        - gridcell "西南" [ref=e213]
        - gridcell "王一舟" [ref=e214]
        - gridcell "¥8,296.3" [ref=e215]
        - gridcell "active" [ref=e216]
        - gridcell "68%" [ref=e217]
        - gridcell "2025-10-28" [ref=e218]
      - row [ref=e219]:
        - gridcell [ref=e220]:
          - checkbox "选择 工单 16" [ref=e221]
        - gridcell "100015" [ref=e222]
        - gridcell "工单 16" [ref=e223]
        - gridcell "西南" [ref=e224]
        - gridcell "赵青禾" [ref=e225]
        - gridcell "¥4,862.6" [ref=e226]
        - gridcell "paused" [ref=e227]
        - gridcell "23%" [ref=e228]
        - gridcell "2025-10-10" [ref=e229]
      - row [ref=e230]:
        - gridcell [ref=e231]:
          - checkbox "选择 工单 17" [ref=e232]
        - gridcell "100016" [ref=e233]
        - gridcell "工单 17" [ref=e234]
        - gridcell "华北" [ref=e235]
        - gridcell "王一舟" [ref=e236]
        - gridcell "¥2,893" [ref=e237]
        - gridcell "archived" [ref=e238]
        - gridcell "83%" [ref=e239]
        - gridcell "2025-10-30" [ref=e240]
      - row [ref=e241]:
        - gridcell [ref=e242]:
          - checkbox "选择 工单 18" [ref=e243]
        - gridcell "100017" [ref=e244]
        - gridcell "工单 18" [ref=e245]
        - gridcell "华东" [ref=e246]
        - gridcell "孙砚" [ref=e247]
        - gridcell "¥5,849.1" [ref=e248]
        - gridcell "paused" [ref=e249]
        - gridcell "12%" [ref=e250]
        - gridcell "2025-10-13" [ref=e251]
      - row [ref=e252]:
        - gridcell [ref=e253]:
          - checkbox "选择 工单 19" [ref=e254]
        - gridcell "100018" [ref=e255]
        - gridcell "工单 19" [ref=e256]
        - gridcell "西南" [ref=e257]
        - gridcell "赵青禾" [ref=e258]
        - gridcell "¥4,651.5" [ref=e259]
        - gridcell "archived" [ref=e260]
        - gridcell "64%" [ref=e261]
        - gridcell "2025-11-08" [ref=e262]
      - row [ref=e263]:
        - gridcell [ref=e264]:
          - checkbox "选择 工单 20" [ref=e265]
        - gridcell "100019" [ref=e266]
        - gridcell "工单 20" [ref=e267]
        - gridcell "华北" [ref=e268]
        - gridcell "林晓" [ref=e269]
        - gridcell "¥4,571" [ref=e270]
        - gridcell "active" [ref=e271]
        - gridcell "91%" [ref=e272]
        - gridcell "2025-10-21" [ref=e273]
      - row [ref=e274]:
        - gridcell [ref=e275]:
          - checkbox "选择 工单 21" [ref=e276]
        - gridcell "100020" [ref=e277]
        - gridcell "工单 21" [ref=e278]
        - gridcell "华南" [ref=e279]
        - gridcell "王一舟" [ref=e280]
        - gridcell "¥677.8" [ref=e281]
        - gridcell "active" [ref=e282]
        - gridcell "54%" [ref=e283]
        - gridcell "2025-10-25" [ref=e284]
      - row [ref=e285]:
        - gridcell [ref=e286]:
          - checkbox "选择 工单 22" [ref=e287]
        - gridcell "100021" [ref=e288]
        - gridcell "工单 22" [ref=e289]
        - gridcell "西南" [ref=e290]
        - gridcell "林晓" [ref=e291]
        - gridcell "¥9,486.4" [ref=e292]
        - gridcell "archived" [ref=e293]
        - gridcell "61%" [ref=e294]
        - gridcell "2025-10-31" [ref=e295]
      - row [ref=e296]:
        - gridcell [ref=e297]:
          - checkbox "选择 工单 23" [ref=e298]
        - gridcell "100022" [ref=e299]
        - gridcell "工单 23" [ref=e300]
        - gridcell "华南" [ref=e301]
        - gridcell "王一舟" [ref=e302]
        - gridcell "¥5,161.7" [ref=e303]
        - gridcell "active" [ref=e304]
        - gridcell "22%" [ref=e305]
        - gridcell "2025-10-12" [ref=e306]
      - row [ref=e307]:
        - gridcell [ref=e308]:
          - checkbox "选择 工单 24" [ref=e309]
        - gridcell "100023" [ref=e310]
        - gridcell "工单 24" [ref=e311]
        - gridcell "华北" [ref=e312]
        - gridcell "孙砚" [ref=e313]
        - gridcell "¥6,344" [ref=e314]
        - gridcell "active" [ref=e315]
        - gridcell "70%" [ref=e316]
        - gridcell "2025-10-19" [ref=e317]
```

# Test source

```ts
  15  |       expect(pageErrors, '未捕获的页面异常').toEqual([]);
  16  |       expect(consoleErrors, 'console.error 输出').toEqual([]);
  17  |     },
  18  |     { auto: true },
  19  |   ],
  20  | });
  21  | 
  22  | async function openPrototype(page: import('@playwright/test').Page) {
  23  |   await page.setViewportSize({ width: 1280, height: 800 });
  24  |   await page.goto('/');
  25  |   await expect(page.getByRole('heading', { level: 1, name: 'ZUVI 组件库' })).toBeVisible();
  26  |   await page.evaluate(() => {
  27  |     window.location.hash = '/prototype/datagrid';
  28  |   });
  29  |   const grid = page.getByRole('grid', { name: '性能原型表格' });
  30  |   await expect(grid).toBeVisible();
  31  |   return grid;
  32  | }
  33  | 
  34  | /** 双 rAF 等待一帧提交后的端到端延迟 */
  35  | async function measureClickLatency(page: import('@playwright/test').Page, selector: string) {
  36  |   return page.evaluate(async (target) => {
  37  |     const element = document.querySelector<HTMLElement>(target);
  38  |     if (!element) throw new Error(`missing ${target}`);
  39  |     const started = performance.now();
  40  |     element.click();
  41  |     await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  42  |     return performance.now() - started;
  43  |   }, selector);
  44  | }
  45  | 
  46  | test('DataGrid 原型：虚拟化窗口只渲染可见行', async ({ page }) => {
  47  |   const grid = await openPrototype(page);
  48  | 
  49  |   // 480px 视口 / 40px 行高 = 12 行 + 12 overscan + 1 表头 ≈ 25；绝不能是 10,000
  50  |   const rowCount = await grid.getByRole('row').count();
  51  |   expect(rowCount).toBeGreaterThan(10);
  52  |   expect(rowCount).toBeLessThan(60);
  53  | 
  54  |   const domText = await page.getByTestId('metric-dom').textContent();
  55  |   const domNodes = Number(domText?.replace(/\D/g, ''));
  56  |   expect(domNodes).toBeGreaterThan(0);
  57  |   expect(domNodes).toBeLessThan(1200); // 全量渲染 10k 行会是数十万节点
  58  | 
  59  |   // 滚动到底部：窗口大小不变，行内容更新
  60  |   await page.evaluate(() => {
  61  |     const viewport = document.querySelector('[data-testid="datagrid-viewport"]') as HTMLElement;
  62  |     viewport.scrollTop = viewport.scrollHeight;
  63  |   });
  64  |   await expect(page.getByTestId('metric-rows')).toContainText('10000');
  65  |   const rowCountAfterScroll = await grid.getByRole('row').count();
  66  |   expect(rowCountAfterScroll).toBeLessThan(60);
  67  | });
  68  | 
  69  | test('DataGrid 原型：10k 行排序与全选的端到端延迟', async ({ page }) => {
  70  |   await openPrototype(page);
  71  | 
  72  |   const sortLatency = await measureClickLatency(page, '[data-testid="sort-amount"]');
  73  | 
  74  |   console.log(`[datagrid-perf] sort(10k): ${sortLatency.toFixed(1)}ms`);
  75  |   expect(sortLatency).toBeLessThan(150);
  76  |   await expect(page.getByTestId('metric-sort')).toContainText('ms');
  77  |   // 表头进入 descending 状态后再次点击回到升序
  78  |   await expect(page.getByRole('columnheader', { name: /金额/ })).toHaveAttribute(
  79  |     'aria-sort',
  80  |     'ascending'
  81  |   );
  82  | 
  83  |   const selectLatency = await measureClickLatency(page, '[data-testid="select-all"]');
  84  | 
  85  |   console.log(`[datagrid-perf] select-all(10k): ${selectLatency.toFixed(1)}ms`);
  86  |   expect(selectLatency).toBeLessThan(150);
  87  |   await expect(page.getByTestId('metric-selected')).toContainText('10000');
  88  | });
  89  | 
  90  | test('DataGrid 原型：列宽更新延迟在预算内，按住不动不计入渲染耗时', async ({ page }) => {
  91  |   await openPrototype(page);
  92  | 
  93  |   const handle = page.getByTestId('resize-name');
  94  |   const box = await handle.boundingBox();
  95  |   expect(box).not.toBeNull();
  96  |   const nameHeader = page.getByRole('columnheader', { name: /名称/ });
  97  |   const widthBefore = (await nameHeader.getAttribute('style')) ?? '';
  98  | 
  99  |   await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  100 |   await page.mouse.down();
  101 |   // 用户按住但不移动时没有列宽更新；该停顿不能成为渲染延迟。
  102 |   await page.waitForTimeout(180);
  103 |   await page.mouse.move(box!.x + box!.width / 2 + 160, box!.y + box!.height / 2, { steps: 12 });
  104 |   await page.mouse.up();
  105 | 
  106 |   const widthAfter = (await nameHeader.getAttribute('style')) ?? '';
  107 |   expect(widthAfter).not.toEqual(widthBefore);
  108 | 
  109 |   await expect(page.getByTestId('metric-resize')).toContainText('ms');
  110 |   const resizeText = await page.getByTestId('metric-resize').textContent();
  111 |   const worstFrame = Number(resizeText?.replace(/[^0-9.]/g, ''));
  112 | 
  113 |   console.log(`[datagrid-perf] resize input-to-frame latency: ${worstFrame}ms`);
  114 |   expect(worstFrame).toBeGreaterThan(0);
> 115 |   expect(worstFrame).toBeLessThan(64); // 列宽更新到下一帧的延迟预算
      |                      ^ Error: expect(received).toBeLessThan(expected)
  116 | });
  117 | 
  118 | test('DataGrid 原型：横向滚动时固定列保持可见', async ({ page }) => {
  119 |   await openPrototype(page);
  120 | 
  121 |   // 先把名称列拖宽，制造横向溢出
  122 |   const handle = page.getByTestId('resize-name');
  123 |   const box = await handle.boundingBox();
  124 |   await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  125 |   await page.mouse.down();
  126 |   await page.mouse.move(box!.x + box!.width / 2 + 500, box!.y + box!.height / 2, { steps: 8 });
  127 |   await page.mouse.up();
  128 | 
  129 |   const idHeader = page.locator('.datagrid-prototype-cell--sticky-second').first();
  130 |   const beforeX = (await idHeader.boundingBox())?.x;
  131 |   await page.evaluate(() => {
  132 |     const viewport = document.querySelector('[data-testid="datagrid-viewport"]') as HTMLElement;
  133 |     viewport.scrollLeft = viewport.scrollWidth;
  134 |   });
  135 |   await page.waitForTimeout(120);
  136 |   const afterX = (await idHeader.boundingBox())?.x;
  137 |   expect(beforeX).not.toBeNull();
  138 |   expect(afterX).toBeCloseTo(beforeX!, 0);
  139 | });
  140 | 
```