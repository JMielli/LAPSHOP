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

// Função para limpar texto
const cleanText = (text) => {
	if (typeof text === "string") {
		return text.replace(/‎/g, "").trim(); // Remove o caractere especial e espaços em branco
	}
	return null; // Retorna null se não for uma string
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
		price: product.price ? convertPrice(cleanText(product.price)) : null, // Formata o preço
	}));
};

// Função para salvar os dados formatados em novos arquivos JSON
const saveFormattedData = (formattedProducts, originalFilename) => {
	const formattedDir = path.join(__dirname, "formatted"); // Diretório para arquivos formatados

	// Cria a pasta "formatted" se não existir
	if (!fs.existsSync(formattedDir)) {
		fs.mkdirSync(formattedDir);
	}

	const newFilename = originalFilename.replace(".json", "_formatted.json");
	fs.writeFileSync(
		path.join(formattedDir, newFilename),
		JSON.stringify(formattedProducts, null, 2)
	);

	return newFilename; // Retorna o novo nome do arquivo
};

// Carrega os arquivos JSON e aplica a formatação
const processJsonFiles = () => {
	const loadedJsonFiles = loadJsonFiles();

	loadedJsonFiles.forEach(({ filename, data }) => {
		const formattedProducts = formatData(data);
		const newFilename = saveFormattedData(formattedProducts, filename); // Armazena o novo nome do arquivo
		console.log(
			`Dados formatados salvos em ${path.join("formatted", newFilename)}`
		); // Usa o novo nome aqui
	});
};

// Executa o processamento dos arquivos JSON
processJsonFiles();
