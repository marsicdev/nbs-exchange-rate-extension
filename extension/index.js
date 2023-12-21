//@ts-check
const NBS_EXCHANGE_RATE_URL =
    'https://www.nbs.rs/kursnaListaModul/srednjiKurs.faces'

const DOMSelector = Object.freeze({
    htmlTag: 'html',
    markTag: 'mark',
    ratesTableRow: '.indexsrednjiKursListaTable tr',
    ratesList: '.rates-list',
    updateDateTimeText: '.update-date-time',
    infoText: '.info',
    logoImage: '.logo',
})

function fetchExchangeRates(lang = 'eng') {
    const nbsCorsEndpoint = `https://cors.hypetech.xyz/${NBS_EXCHANGE_RATE_URL}?lang=${lang}`
    fetch(nbsCorsEndpoint)
        .then((response) => response.text())
        .then((data) => {
            displayLoading()

            const parser = new DOMParser()
            const htmlDoc = parser.parseFromString(data, 'text/html')

            const currencyList = []

            // Get currency list
            htmlDoc.querySelectorAll(DOMSelector.ratesTableRow).forEach((elem, index) => {
                if (!index) return
                currencyList.push(elem)
            })

            if (currencyList.length === 0) {
                displayError("Couldn't fetch exchange rates.")
                return
            }

            // Create HTML output
            const rows = []
            const tempRows = []
            let htmlOutput = '<div>'
            currencyList
                .forEach((elem) => {
                    const exchangeRateRow = elem.innerHTML
                        .trim()
                        .replaceAll(` tabindex="0"`, '')
                        .replaceAll(`<td>`, '')
                        .split('</td>')
                        .map((item) => item.trim())

                    const currencyCode = exchangeRateRow[0]
                    const order = ["EUR", "USD", "GBP", "CHF", "EUR", "CAD"]

                    if (order.includes(currencyCode)) {
                        tempRows.unshift(createCardHTML(exchangeRateRow))
                    } else {
                        rows.push(createCardHTML(exchangeRateRow))
                    }
                })

            const more = `
                <details class="more">
                    <summary><strong>SHOW MORE</strong></summary>
                    ${rows.join("")}
                </details>`

            // End HTML output
            htmlOutput += tempRows.reverse().join("") + more + '</div>'

            // Display HTML output
            const $ratesList = document.querySelector(DOMSelector.ratesList)

            if (!$ratesList) return //TODO: Handle error

            $ratesList.innerHTML = htmlOutput

            // Setup listeners for copy to clipboard
            document.querySelectorAll(DOMSelector.markTag).forEach(($mark) => {
                $mark?.addEventListener('click', attachCopyListener.bind(null, $mark))
            })

            // Update update date time text content with fetch date time
            const $updateDateTime = document.querySelector(DOMSelector.updateDateTimeText)
            if ($updateDateTime) {
                $updateDateTime.textContent = formatUpdateDateTime()
            }
        })
        .catch((error) => {
            displayError()
            console.error('Error fetching exchange rates:', error)
        })
        .finally(() => {
            displayLoading(false)
        })
}

function formatUpdateDateTime() {
    const options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
    }

    // @ts-ignore
    return new Intl.DateTimeFormat(undefined, options).format(new Date())
}

function attachCopyListener($mark) {
    const clipboardText = $mark.textContent

    if (!clipboardText) return

    navigator.clipboard.writeText(clipboardText)
    const $info = document.querySelector(DOMSelector.infoText)

    if (!$info) return

    $info.classList.remove('hidden')
    $info.textContent = 'Copied to clipboard'

    setTimeout(() => {
        $info?.classList.add('hidden')
    }, 1500)
}

function createCardHTML(exchangeRateRow) {
    const [label, code, country, unit, rate] = exchangeRateRow
    return `
        <article>
            <hgroup>
                <small>${country}</small>
                <h2><span>${label}<span> <mark data-tooltip="Copy">${rate}</mark></h2>
                <h3><small>${unit} ${label} = ${rate} RSD</small></h3>
            </hgroup>
        </article>
    `
}

function displayLoading(loading = true) {
    const $logoImage = document.querySelector('img')

    if (loading) {
        $logoImage?.classList.add('shimmer')
    } else {
        // Add delay to show shimmer effect on fast loading
        setTimeout(() => {
            $logoImage?.classList.remove('shimmer')
        }, 1000)
    }
}

function displayError(msg = 'Error fetching exchange rates') {
    const $main = document.querySelector('main')

    if (!$main) return

    $main.innerHTML = `<div class="box"><kbd>${msg}<kbd></div>`
}

function detectTheme() {
    const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)')

    const theme = darkThemeMq.matches ? 'dark' : 'light'
    document.querySelector(DOMSelector.htmlTag)?.setAttribute('data-theme', theme)
}

function setupListeners() {
    document.querySelector('.nbs')?.addEventListener('click', () => {
        // @ts-ignore
        chrome.tabs.create({
            url: NBS_EXCHANGE_RATE_URL,
        })
    })

    document.querySelector('.about')?.addEventListener('click', () => {
        alert(`This is unofficial extension and is not affiliated with NBS.\n
Purpose of this extension is to provide a quick access and information about official middle RSD(Serbian Dinar) exchange rate.\n
Published under MIT license.\n
Developed by @marsicdev.`)
    })

    document.querySelector('.developer')?.addEventListener('click', () => {
        // @ts-ignore
        chrome.tabs.create({
            url: 'https://github.com/marsicdev',
        })
    })

    document.querySelector('.eng')?.addEventListener('click', () => {
        fetchExchangeRates('eng')
        document.querySelector('.lat')?.classList.remove('active')
        document.querySelector('.eng')?.classList.add('active')
    })

    document.querySelector('.lat')?.addEventListener('click', () => {
        fetchExchangeRates('lat')
        document.querySelector('.eng')?.classList.remove('active')
        document.querySelector('.lat')?.classList.add('active')
    })
}

function init() {
    detectTheme()
    setupListeners()
    fetchExchangeRates()
}

document.addEventListener('DOMContentLoaded', init)
