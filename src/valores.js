const express = require("express");
const connection = require("../banco.js");
const app = express();
app.use(express.json());

app.get("/api/valores", (req, res) => {
  connection.query("SELECT * FROM valores", (err, results) => {
    if (err) {
      console.error("Erro ao executar a consulta:", err);
      res.status(500).json({ error: "Erro ao consultar registros" });
      return;
    }
    res.json(results);
  });
});
app.get("/api/resultados", (req, res) => {
  connection.query("SELECT * FROM resultados", (err, results) => {
    if (err) {
      console.error("Erro ao executar a consulta:", err);
      res.status(500).json({ error: "Erro ao consultar registros" });
      return;
    }
    res.json(results);
  });
});
app.get("/api/todosValores", (req, res) => {
  const query = `
      SELECT *
      FROM valores v
      JOIN resultados r ON v.id = r.id
    `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao executar a consulta:", err);
      res.status(500).json({ error: "Erro ao consultar registros" });
      return;
    }

    const values = results.map((row) => ({
      id: row.id,
      potenciaTotalParametroKw: row.potenciaTotalParametroKw,
      potenciaTotalPainel: row.potenciaTotalPainel,
      alturaPainel: row.alturaPainel,
      larguraPainel: row.larguraPainel,
      maximoPainelPorMicroInversor: row.maximoPainelPorMicroInversor,
    }));

    const calculations = results.map((row) => ({
      id: row.id,
      quantidadeDePaineis: row.quantidadeDePaineis,
      quantidadeMicroInversores: row.quantidadeMicroInversores,
      quantidadeColunas: row.quantidadeColunas,
      comprimentoDaEstrutura: row.comprimentoDaEstrutura,
      alturaDaEstrutura: row.alturaDaEstrutura,
      areaUtil: row.areaUtil,
    }));

    res.json({ values, calculations });
  });
});

app.post("/api/valores", (req, res) => {
  const {
    potenciaTotalParametroKw,
    potenciaTotalPainel,
    alturaPainel,
    larguraPainel,
    maximoPainelPorMicroInversor,
  } = req.body;

  const query =
    "INSERT INTO valores (potenciaTotalParametroKw, potenciaTotalPainel, alturaPainel, larguraPainel, maximoPainelPorMicroInversor) VALUES (?, ?, ?, ?, ?)";
  connection.query(
    query,
    [
      potenciaTotalParametroKw,
      potenciaTotalPainel,
      alturaPainel,
      larguraPainel,
      maximoPainelPorMicroInversor,
    ],
    (err, result) => {
      if (err) {
        console.error("Erro ao inserir valores:", err);
        res.status(500).json({ error: "Erro ao inserir valores" });
        return;
      }

      // Calcular os valores adicionais
      const quantidadeDePaineis =
        (potenciaTotalParametroKw * 1000) / potenciaTotalPainel;
      const quantidadeMicroInversores =
        quantidadeDePaineis / maximoPainelPorMicroInversor;
      const quantidadeColunas = quantidadeDePaineis / 2;
      const comprimentoDaEstrutura = quantidadeColunas * larguraPainel;
      const alturaDaEstrutura = 2 * comprimentoDaEstrutura;
      const areaUtil = comprimentoDaEstrutura * alturaDaEstrutura;

      // Inserir os valores calculados na tabela "resultados"
      const resultadosQuery =
        "INSERT INTO resultados (quantidadeDePaineis, quantidadeMicroInversores, quantidadeColunas, comprimentoDaEstrutura, alturaDaEstrutura, areaUtil) VALUES (?, ?, ?, ?, ?, ?)";
      connection.query(
        resultadosQuery,
        [
          quantidadeDePaineis,
          quantidadeMicroInversores,
          quantidadeColunas,
          comprimentoDaEstrutura,
          alturaDaEstrutura,
          areaUtil,
        ],
        (err, result) => {
          if (err) {
            console.error("Erro ao inserir resultados:", err);
            res.status(500).json({ error: "Erro ao inserir resultados" });
            return;
          }
          res
            .status(201)
            .json({ message: "Valores e resultados inseridos com sucesso" });
        }
      );
    }
  );
});

app.listen(3000, () => {
  console.log("Servidor Express iniciado na porta 3000");
});
