const puppeteer = require('puppeteer')
const fs = require('fs')

function generateDateArray(startDate, endDate) {
  const dateArray = []
  const start = new Date(startDate + '-01')
  const end = new Date(endDate + '-01')

  let currentDate = start
  while (currentDate <= end) {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const formattedDate = `${year}-${month}`
    dateArray.push(formattedDate)

    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  return dateArray
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function scrapeWebsiteData(date) {
  const baseUrl = `https://e-service.cwb.gov.tw/HistoryDataQuery/MonthDataController.do?command=viewMain&station=466920&stname=%25E8%2587%25BA%25E5%258C%2597&datepicker=${date}&altitude=5.3m`

  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    })
    const page = await browser.newPage()
    await page.goto(baseUrl)
    const tr_array = await page.$$eval(
      'table#MyTable > tbody > tr',
      (items, date) => {
        let res = []
        for (let i = 3; i < items.length; i += 1) {
          let td_array = items[i].children
          res.push({
            day: date + '-' + td_array[0].innerText.trim(),
            status: Number(td_array[34].innerText.trim()) ? parseFloat(td_array[34].innerText.trim()) : 0.0,
            temperature: Number(td_array[7].innerText.trim()) ? parseFloat(td_array[7].innerText.trim()) : 0.0,
            humidity: Number(td_array[13].innerText.trim()) ? parseFloat(td_array[13].innerText.trim()) : 0.0,
            precipitation: Number(td_array[21].innerText.trim()) ? parseFloat(td_array[21].innerText.trim()) : 0.0,
          })
        }
        return res
      },
      date
    )
    await page.close()
    await browser.close()
    return tr_array
  } catch (error) {
    console.error(error)
    throw new Error('Failed to scrape website data')
  }
}

;(async function exportData() {
  let startDate = '2018-01'
  let endDate = '2023-07'
  let dateArray = generateDateArray(startDate, endDate)
  let res = []
  let data = await scrapeWebsiteData('2023-07')
  delay(2000)
  res = res.concat(data)
  for (let date of dateArray) {
    // let data = await scrapeWebsiteData(date)
    // delay(2000)
    // res = res.concat(data)
  }

  const jsonData = JSON.stringify(res, null, 2)
  fs.writeFile('data.json', jsonData, (error) => {
    if (error) {
      console.log('匯出檔案失敗')
      console.log(error)
    } else {
      console.log('成功匯出檔案')
    }
  })
})()
