import puppeteer from 'puppeteer';
import express from 'express'

const app = express()
const port = process.env.PORT || 3000;

let arenas = {}
let lastUpdate = 0
let updateInterval = 1 * 60 * 1000

app.get('/arenas', async (req, res) => {
    try {
        await updateArenas()
    } catch (e) {
        console.error('Error updating arenas:', e);
        return res.status(500).json({ error: 'Internal server error occurred' })
    }

    res.send(arenas)
})

app.get('/arenas/:name', async (req, res) => {
    const name = req.params.name.toUpperCase();

    try {
        await updateArenas()
    } catch (e) {
        console.error('Error updating arenas:', e);
        return res.status(500).json({ error: 'Internal server error occurred' })
    }

    res.send({ [name]: getPlayersFromArena(name) })
})

app.listen(port, () => {
    console.log(`FFS Api listening on port ${port}`)
})

const getPageContent = async () => {
    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Navigate the page to a URL.
    await page.goto('https://ffs.gg/monitor.php', { waitUntil: 'networkidle2' });

    // Set screen size.
    await page.setViewport({ width: 1080, height: 1024 });

    await page.waitForSelector('div.monitorPage')

    const content = await page.content()

    await browser.close();

    return content
}

// get all arenas and players for each arena
const updateArenas = async () => {
    // if updated in the last minute
    if (Date.now() - lastUpdate < updateInterval) {
        return arenas
    }

    // get page content
    let content = await getPageContent()

    // find all arenas in page content
    const regex = /<th[^>]*>(.*?)<span[^>]*>(\d+)/g;
    const matches = [...content.matchAll(regex)]

    // reset arenas
    arenas = {}

    // update arenas with current info
    matches.forEach((match) => arenas[match[1].toUpperCase()] = match[2])

    // update lastUpdated
    lastUpdate = Date.now()

    return arenas
}

const getPlayersFromArena = (arenaName) => {
    // get players from specific arena
    return arenas[arenaName] || 0;
}