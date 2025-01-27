// How to:
// 1.) npm install
// 2.) run: node scraper.js "<YOUR SEARCH PARAM>"
// node scraper.js "

const puppeteer = require("puppeteer");
const fs = require("fs");

// Verifica se foi passado um argumento para o nome do objeto de busca
const searchQuery = process.argv[2];

if (!searchQuery) {
	console.error("Por favor, insira um nome de objeto para buscar.");
	process.exit(1);
}

(async () => {
	// Inicia o navegador
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	// Constrói a URL de busca com base no argumento fornecido
	const searchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(searchQuery)}`;

	// Acesse o site de e-commerce
	await page.goto(searchUrl, { waitUntil: "load", timeout: 0 });

	// Extraia links dos produtos
	const productLinks = await page.evaluate(() => {
		const items = document.querySelectorAll(".s-result-item h2 a");
		const links = [];

		items.forEach((item) => {
			links.push(item.href);
		});

		return links;
	});

	const products = [];

	// Itere sobre cada link de produto
	for (const link of productLinks) {
		await page.goto(link, { waitUntil: "load", timeout: 0 });

		const product = await page.evaluate(() => {
			// Função para limpar texto
			const cleanText = (text) => {
				return text ? text.replace(/‎/g, "").trim() : null;
			};

			const title = cleanText(document.querySelector("#productTitle") ? document.querySelector("#productTitle").innerText : null);
			const price = cleanText(document.querySelector(".a-price span.a-offscreen") ? document.querySelector(".a-price span.a-offscreen").innerText : null);
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
			// Tente capturar diferentes seções de detalhes técnicos
			document.querySelectorAll("#productDetails_techSpec_section_1 tr, #productDetails_techSpec_section_2 tr, #techSpecSoftlinesWrapper tr").forEach((row) => {
				const key = cleanText(row.querySelector("th") ? row.querySelector("th").innerText : null);
				const value = cleanText(row.querySelector("td") ? row.querySelector("td").innerText : null);
				if (key && value) {
					details[key] = value;
				}
			});

			const additionalInfo = {};
			// Tente capturar diferentes seções de informações adicionais
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

		if (product.title) {
			products.push(product);
		}
	}

	// Salva os dados em um arquivo JSON
	let searchQueryToJSON = searchQuery.toLowerCase();
	searchQueryToJSON = searchQueryToJSON.replaceAll(" ", "_");
	fs.writeFileSync(`products_${searchQueryToJSON}.json`, JSON.stringify(products, null, 2));

	console.log(`Dados salvos em products_${searchQueryToJSON}.json`);

	// Feche o navegador
	await browser.close();
})();
