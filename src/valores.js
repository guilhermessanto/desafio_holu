const express = require("express");
const connection = require("../banco.js");
const app = express();
app.use(express.json());

// Consulta todos os valores
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

// Consulta todos os resultados
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

// Consulta todos os valores e resultados com base na relação entre as tabelas
app.get("/api/todosValores", (req, res) => {
  const query = `
  SELECT valores.*, resultados.*
  FROM valores
  JOIN resultados ON valores.id = resultados.id_valores
`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao executar a consulta:", err);
      res.status(500).json({ error: "Erro ao consultar registros" });
      return;
    }

    const data = results.map((row) => ({
      valores: {
        id: row.id,
        potenciaTotalParametroKw: row.potenciaTotalParametroKw,
        potenciaTotalPainel: row.potenciaTotalPainel,
        alturaPainel: row.alturaPainel,
        larguraPainel: row.larguraPainel,
        maximoPainelPorMicroInversor: row.maximoPainelPorMicroInversor,
      },
      resultados: {
        id: row.id_resultados,
        quantidadeDePaineis: row.quantidadeDePaineis,
        quantidadeMicroInversores: row.quantidadeMicroInversores,
        quantidadeColunas: row.quantidadeColunas,
        comprimentoDaEstrutura: row.comprimentoDaEstrutura,
        alturaDaEstrutura: row.alturaDaEstrutura,
        areaUtil: row.areaUtil,
      },
    }));

    res.json(data);
  });
});

// Inserção de valores e cálculo dos resultados
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

      const id_valores = result.insertId;

      // Calcular os valores adicionais
      const quantidadeDePaineis = Math.ceil(
        (potenciaTotalParametroKw * 1000) / potenciaTotalPainel
      );
      const quantidadeMicroInversores = Math.ceil(
        quantidadeDePaineis / maximoPainelPorMicroInversor
      );
      const quantidadeColunas = Math.ceil(quantidadeDePaineis / 2);
      const comprimentoDaEstrutura = quantidadeColunas * larguraPainel;
      const alturaDaEstrutura = 2 * comprimentoDaEstrutura;
      const areaUtil = comprimentoDaEstrutura * alturaDaEstrutura;

      // Inserir os valores calculados na tabela "resultados"
      const resultadosQuery =
        "INSERT INTO resultados (id_valores, quantidadeDePaineis, quantidadeMicroInversores, quantidadeColunas, comprimentoDaEstrutura, alturaDaEstrutura, areaUtil) VALUES (?, ?, ?, ?, ?, ?, ?)";
      connection.query(
        resultadosQuery,
        [
          id_valores,
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
// Limpar todos os registros da tabela "valores"
app.delete("/api/valores", (req, res) => {
  connection.query("DELETE FROM valores", (err, result) => {
    if (err) {
      console.error("Erro ao excluir registros da tabela 'valores':", err);
      res.status(500).json({ error: "Erro ao excluir registros" });
      return;
    }
    res.json({
      message: "Registros da tabela 'valores' excluídos com sucesso",
    });
  });
});

// Limpar todos os registros da tabela "resultados"
app.delete("/api/resultados", (req, res) => {
  connection.query("DELETE FROM resultados", (err, result) => {
    if (err) {
      console.error("Erro ao excluir registros da tabela 'resultados':", err);
      res.status(500).json({ error: "Erro ao excluir registros" });
      return;
    }
    res.json({
      message: "Registros da tabela 'resultados' excluídos com sucesso",
    });
  });
});

app.listen(3000, () => {
  console.log("Servidor Express iniciado na porta 3000");
});
