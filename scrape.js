//scrape.js
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const proxyChain = require('proxy-chain');
const axios = require('axios');
const uuid = require('uuid');
require('chromedriver'); // Ensure chromedriver is installed

(async function scrapeAndSend() {
    // let driver = await new Builder().forBrowser('chrome').build();
    const oldProxyUrl = 'http://accessor:access@@15@us-ca.proxymesh.com:31280';
    try {
        // Anonymize the proxy URL
        const newProxyUrl = await proxyChain.anonymizeProxy({ url: oldProxyUrl });

        // Configure Chrome options with anonymized proxy
        const chromeOptions = new chrome.Options();
        chromeOptions.addArguments(`--proxy-server=${newProxyUrl}`);

        // Build WebDriver instance with configured options
        let driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(chromeOptions)
            .build();
        await driver.get('https://x.com/home');

        // Accept cookies if present
        try {
            let acceptCookiesButton = await driver.wait(until.elementLocated(By.xpath("//button[.//span[contains(text(), 'Accept all cookies')]]")), 10000);
            await acceptCookiesButton.click();
        } catch (error) {
            console.log("No cookies button found or click timeout exceeded, proceeding without clicking.");
        }

        // Log in to Twitter
        try {
            let loginButton = await driver.wait(until.elementLocated(By.css('div a[href="/login"]')), 10000);
            await loginButton.click();

            let usernameInput = await driver.wait(until.elementLocated(By.css('div input[autocomplete="username"]')), 10000);
            await usernameInput.sendKeys('petersam1211');

            let nextButton = await driver.wait(until.elementLocated(By.xpath("//div[contains(@class, 'css-146c3p1')]//span[contains(text(), 'Next')]")), 10000);
            await nextButton.click();

            let passwordInput = await driver.wait(until.elementLocated(By.css('div input[autocomplete="current-password"]')), 10000);
            await passwordInput.sendKeys('khankhan321@');

            let loginSubmitButton = await driver.wait(until.elementLocated(By.xpath("//span[contains(text(), 'Log in')]")), 10000);
            await loginSubmitButton.click();
        } catch (error) {
            console.log("Error during login process: ", error);
            return;
        }

        // Wait for trends to load
        try {
            await driver.wait(until.elementsLocated(By.xpath('//*[@data-testid="trend"]/div/div[2]/span')), 30000);
        } catch (error) {
            console.log("Error waiting for trends to load: ", error);
            return;
        }

        let trends;
        try {
            trends = await driver.findElements(By.xpath('//*[@data-testid="trend"]/div/div[2]/span'));
        } catch (error) {
            console.log("Error finding trends: ", error);
            return;
        }

        let trendData = {
            id: uuid.v4(),
            nameoftrend1: trends[0] ? await trends[0].getText() : "N/A",
            nameoftrend2: trends[1] ? await trends[1].getText() : "N/A",
            nameoftrend3: trends[2] ? await trends[2].getText() : "N/A",
            nameoftrend4: trends[3] ? await trends[3].getText() : "N/A",
            nameoftrend5: trends[4] ? await trends[4].getText() : "N/A",
            ip_address: await getProxyIpAddress(newProxyUrl)
            
        };

        // Send data to MongoDB through Express server
        try {
            await axios.post('http://localhost:3000/trends', trendData);
            console.log("Data sent successfully!");
        } catch (error) {
            console.log("Error sending data to MongoDB: ", error);
        }

    } finally {
        await driver.quit();
    }
})();
async function getProxyIpAddress(proxyUrl) {
    const parsedUrl = new URL(proxyUrl);
    const proxyConfig = {
        proxy: {
            host: parsedUrl.hostname,
            port: parsedUrl.port,
            auth: {
                username: parsedUrl.username,
                password: decodeURIComponent(parsedUrl.password)
            }
        }
    };

    const maxRetries = 3;
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const response = await axios.get('https://api64.ipify.org?format=json', {
                proxy: {
                    host: proxyConfig.proxy.host,
                    port: proxyConfig.proxy.port,
                    auth: {
                        username: proxyConfig.proxy.auth.username,
                        password: proxyConfig.proxy.auth.password
                    }
                }
            });
            return response.data.ip || 'N/A';
        } catch (error) {
            console.log(`Error fetching IP address, retrying (${retries + 1}/${maxRetries}):`, error.message);
            retries++;
        }
    }
    console.log(`Failed to fetch IP address after ${maxRetries} retries.`);
    return 'N/A';
}
