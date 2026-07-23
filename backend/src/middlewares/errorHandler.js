function errorHandler(err, req, res, next) {
  console.error('[ERRO]', err.message, err.stack);

  // Erros do better-sqlite3
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({ success: false, message: 'Referência inválida no banco de dados.' });
  }
  if (err.code && err.code.startsWith('SQLITE_')) {
    return res.status(500).json({ success: false, message: 'Erro no banco de dados.', detail: err.message });
  }

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Erro interno do servidor.'
  });
}

module.exports = errorHandler;
