const fs = require("fs");
const path = require("path");

// Função para carregar todos os arquivos .JSON na pasta do script
const loadJsonFiles = () => {
	const jsonFiles = [];
	const files = fs.readdirSync(__dirname); // Lê o diretório atual

	files.forEach((file) => {
		if (file.endsWith(".json")) {
			const data = JSON.parse(
				fs.readFileSync(path.join(__dirname, file), "utf-8")
			);
			jsonFiles.push({ filename: file, data });
		}
	});

	return jsonFiles;
};

// Função para converter o preço de string para número
const convertPrice = (priceStr) => {
	if (typeof priceStr === "string") {
		return parseFloat(
			priceStr.replace("R$", "").replace(".", "").replace(",", ".")
		);
	}
	return null; // Retorna null se priceStr não for uma string
};

// Função para formatar os dados
const formatData = (products) => {
	return products.map((product) => ({
		...product,
		price: product.price ? convertPrice(product.price) : null, // Formata o preço
	}));
};

// Função para salvar os dados formatados em novos arquivos JSON
const saveFormattedData = (formattedProducts, originalFilename) => {
	const newFilename = originalFilename.replace(".json", "_formatted.json");
	fs.writeFileSync(
		path.join(__dirname, newFilename),
		JSON.stringify(formattedProducts, null, 2)
	);
};

// Carrega os arquivos JSON e aplica a formatação
const processJsonFiles = () => {
	const loadedJsonFiles = loadJsonFiles();

	loadedJsonFiles.forEach(({ filename, data }) => {
		const formattedProducts = formatData(data);
		saveFormattedData(formattedProducts, filename);
		console.log(
			`Dados formatados salvos em ${filename.replace(
				".json",
				"_formatted.json"
			)}`
		);
	});
};

// Executa o processamento dos arquivos JSON
processJsonFiles();
