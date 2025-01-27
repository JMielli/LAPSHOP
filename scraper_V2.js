// How to:
// 1.) npm install
// 2.) run: node scraper_V2.js "<YOUR SEARCH PARAM>"
// node scraper.js "

const puppeteer = require("puppeteer");
const fs = require("fs");

// Verifica se foi passado um argumento para o nome do objeto de busca
const searchQuery = process.argv[2];

if (!searchQuery) {
	console.error("Por favor, insira um nome de objeto para buscar.");
	process.exit(1);
}

// para extrair links dos produtos
const extractProductLinks = async (page) => {
	return await page.evaluate(() => {
		const items = document.querySelectorAll(".s-result-item h2 a");
		const links = [];
		items.forEach((item) => {
			links.push(item.href);
		});
		return links;
	});
};

// para extrair detalhes do produto
const extractProductDetails = async (page, link) => {
	await page.goto(link, { waitUntil: "load", timeout: 0 });

	return await page.evaluate(() => {
		const cleanText = (text) => {
			return text ? text.replace(/‎/g, "").trim() : null;
		};

		const convertPrice = (priceStr) => {
			return parseFloat(priceStr.replace("R$", "").replace(".", "").replace(",", "."));
		};

		const title = cleanText(document.querySelector("#productTitle") ? document.querySelector("#productTitle").innerText : null);

		const priceStr = cleanText(document.querySelector(".a-price span.a-offscreen") ? document.querySelector(".a-price span.a-offscreen").innerText : null);

		const price = priceStr ? convertPrice(priceStr) : null;

		const mainImage = document.querySelector("#imgTagWrapperId img") ? document.querySelector("#imgTagWrapperId img").src : null;

		const images = [];
		const imageElements = document.querySelectorAll("#altImages img");
		imageElements.forEach((img) => {
			let src = img.src;
			src = src.replace("_US100_", "_US500_");
			src = src.replace("_US40_", "_US500_");
			images.push(src);
		});

		const details = {};
		document.querySelectorAll("#productDetails_techSpec_section_1 tr, #productDetails_techSpec_section_2 tr, #techSpecSoftlinesWrapper tr").forEach((row) => {
			const key = cleanText(row.querySelector("th") ? row.querySelector("th").innerText : null);
			const value = cleanText(row.querySelector("td") ? row.querySelector("td").innerText : null);
			if (key && value) {
				details[key] = value;
			}
		});

		const additionalInfo = {};
		document.querySelectorAll("#productDetails_db_sections tr, #productDetails_detailBullets_sections1 tr, #detailBullets_feature_div ul li").forEach((row) => {
			const key = cleanText(row.querySelector("th, span.a-text-bold") ? row.querySelector("th, span.a-text-bold").innerText : null);
			const value = cleanText(row.querySelector("td, span.a-text-bold + span") ? row.querySelector("td, span.a-text-bold + span").innerText : null);
			if (key && value) {
				additionalInfo[key] = value;
			}
		});

		return {
			title,
			price,
			mainImage,
			images,
			link: window.location.href,
			details,
			additionalInfo,
		};
	});
};

// para salvar os dados em um arquivo JSON
const saveData = (products, searchQuery) => {
	let searchQueryToJSON = searchQuery.toLowerCase();
	searchQueryToJSON = searchQueryToJSON.replaceAll(" ", "_");
	fs.writeFileSync(`products_${searchQueryToJSON}.json`, JSON.stringify(products, null, 2));
};

(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	try {
		// Constrói a URL de busca com base no argumento fornecido
		const searchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(searchQuery)}`;

		// Acesse o site de e-commerce
		await page.goto(searchUrl, { waitUntil: "load", timeout: 0 });

		// Aguarda a presença dos links dos produtos
		await page.waitForSelector(".s-result-item h2 a");

		// Extrai os links dos produtos
		const productLinks = await extractProductLinks(page);

		const products = [];

		// Itera sobre cada link de produto e extrai detalhes
		for (const link of productLinks) {
			const product = await extractProductDetails(page, link);
			if (product.title) {
				products.push(product);
			}
		}

		// Salva os dados em um arquivo JSON
		saveData(products, searchQuery);

		console.log(`Dados salvos em products_${searchQuery.toLowerCase().replaceAll(" ", "_")}.json`);
	} catch (error) {
		console.error("An error occurred:", error);
	} finally {
		// Feche o navegador
		await browser.close();
	}
})();
