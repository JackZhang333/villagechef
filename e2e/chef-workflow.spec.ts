import { test, expect, type Page } from '@playwright/test';

// Unique credentials for each run
const testPhone = `138${Math.floor(10000000 + Math.random() * 90000000)}`;
const testPassword = 'password123';
const chefName = 'Test Chef';

test.describe('Village Chef Core Flow', () => {

    test('Complete workflow: Register, Login, Create Dish/Menu, Book as Customer, Accept Order', async ({ page, browser }) => {
        // 1. Register Chef
        await page.goto('/auth-app/register');
        await page.fill('input[id="name"]', chefName);
        await page.fill('input[id="phone"]', testPhone);
        await page.fill('input[id="address"]', '上海市浦东新区张江高科');
        await page.fill('textarea[id="bio"]', '擅长川粤融合菜，10年厨艺经验');
        await page.fill('input[id="password"]', testPassword);
        await page.fill('input[id="confirmPassword"]', testPassword);

        await page.click('button:has-text("立即开启厨师生涯")');
        await expect(page).toHaveURL(/\/auth-app\/login/);

        // 2. Login Chef
        await page.fill('input[id="phone"]', testPhone);
        await page.fill('input[id="password"]', testPassword);
        await page.click('button:has-text("立即登录")');
        await expect(page).toHaveURL(/\/chef-app\/dashboard/);

        // 3. Create Dish
        await page.goto('/chef-app/dishes');
        await page.click('button:has-text("新增菜品")');
        await page.fill('input[placeholder="如：外婆红烧肉"]', '家传酱牛肉');
        await page.click('button:has-text("冷菜")');
        await page.fill('input[placeholder="简要介绍口味、食材特点..."]', '精选牛腱肉，秘制酱汁卤制');
        await page.click('button:has-text("创建菜品")');
        await expect(page.locator('text=家传酱牛肉')).toBeVisible();

        // 4. Create Menu
        await page.goto('/chef-app/menu');
        await page.click('button:has-text("新增方案")');
        await page.fill('input[placeholder="如：鸿运当头 · 18道"]', '精品酱香宴');
        await page.fill('input[type="number"] >> nth=0', '8'); // dish_count
        await page.fill('input[type="number"] >> nth=1', '888'); // price
        await page.fill('input[placeholder="介绍这套方案的亮点与定位..."]', '包含招牌酱牛肉，丰俭由人');
        await page.click('button:has-text("立即创建")');
        await expect(page.locator('text=精品酱香宴')).toBeVisible();

        // 5. Add Dish to Menu
        await page.click('button:has-text("配置菜谱")');
        await page.click('button:has-text("挑选菜品")');
        await page.click('text=家传酱牛肉');
        await page.click('button:has-text("保存并完成配置")');
        await expect(page.locator('text=已配 1 道菜')).toBeVisible();

        // 6. Manage Schedule (Ensure availability record exists to avoid RLS issues)
        await page.goto('/chef-app/schedule');
        await page.waitForSelector('div.bg-white.rounded-\\[32px\\]');

        // Dynamically find the first future slot by iterating blocks
        const dayBlocks = page.locator('div.bg-white.rounded-\\[32px\\]');
        const blockCount = await dayBlocks.count();
        let dayNumber = '';
        let slotButton: any;

        for (let i = 0; i < blockCount; i++) {
            const block = dayBlocks.nth(i);
            // Look for any enabled slot (Lunch or Dinner)
            const slot = block.locator('button:not([disabled])').first();
            if (await slot.count() > 0) {
                dayNumber = (await block.locator('h3').textContent()) || '';
                slotButton = slot;
                break;
            }
        }

        if (!slotButton) {
            throw new Error('No enabled slots found in the schedule');
        }

        console.log(`Chef opening slot for day: ${dayNumber}`);
        await slotButton.click();
        await page.click('button:has-text("确认")');
        await page.waitForTimeout(1000);
        await slotButton.click();
        await page.click('button:has-text("确认")');
        await page.waitForTimeout(1000);

        // 7. Get Chef ID for sharing (from Dashboard)
        await page.goto('/chef-app/dashboard');
        const shareLinkIcon = page.locator('a[href^="/share/"]');
        const href = await shareLinkIcon.getAttribute('href');
        expect(href).not.toBeNull();
        const chefId = href?.split('/').pop();

        // 8. Customer Booking (New Context/Page to simulate different user)
        const customerContext = await browser.newContext();
        const customerPage = await customerContext.newPage();
        await customerPage.goto(`/share/${chefId}`);

        // Step 1: Browse and Select Menu
        await customerPage.click('button:has-text("立即预约家宴")');
        await expect(customerPage.locator('text=精选家宴套餐')).toBeVisible();
        await customerPage.click('text=精品酱香宴');
        await customerPage.click('button:has-text("下一步")');

        // Step 2: Select Date (Must be the SAME day chef opened)
        const targetDateButton = customerPage.locator('button.aspect-square').filter({ hasText: new RegExp(`^${dayNumber}$`) });
        await targetDateButton.click();

        // Ensure "Next" button is enabled before clicking
        const nextButton = customerPage.locator('button:has-text("下一步")');
        await expect(nextButton).toBeEnabled({ timeout: 10000 });
        await nextButton.click();

        // Step 3: Fill Contact Info
        await customerPage.fill('input[id="name"]', '张三客户');
        await customerPage.fill('input[id="phone"]', '13912345678');
        await customerPage.fill('textarea[id="address"]', '上海市静安区南京西路1234号');
        await customerPage.fill('input[id="notes"]', '需要多一点餐具，口味稍微清淡一点');
        await customerPage.click('button:has-text("完成预订")');

        // Success Check
        await expect(customerPage.locator('text=预约已提交')).toBeVisible();
        const bookingCode = await customerPage.locator('text=BK').textContent();
        console.log(`Created booking with code: ${bookingCode}`);

        // 8. Chef Manages Order
        await page.goto('/chef-app/orders');
        await page.click('button:has-text("待处理")');
        await expect(page.locator('text=张三客户 的预约')).toBeVisible();

        // Open order details
        await page.click('text=张三客户 的预约');
        await expect(page.locator('text=订单详情')).toBeVisible();

        // Accept Order
        await page.click('button:has-text("立即接单")');
        await expect(page.locator('text=进行中')).toBeVisible();

        // Verify status in list
        await page.goto('/chef-app/orders');
        await page.click('button:has-text("进行中")');
        await expect(page.locator('text=张三客户 的预约')).toBeVisible();

        await test.step('Cleanup (Optional)', async () => {
            // Since this is a test environment, we might let unique IDs handle it.
            // Real cleanup would involve DB access or API calls.
        });
    });

});
