#!/usr/bin/env node

const BASE_URL = '';

// Função para fazer requisições HTTP
async function makeRequest(method, endpoint, data = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    return {
      status: response.status,
      data: result,
      success: response.ok,
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false,
    };
  }
}

// Função para testar autenticação
async function testAuth() {
  console.log('\n🔐 Testando Autenticação...');
  
  // Teste de registro
  console.log('  📝 Testando registro de usuário...');
  const registerResult = await makeRequest('POST', '/api/auth/register', {
    name: 'Usuário Teste',
    email: 'teste@exemplo.com',
    password: 'senha123456',
    phone: '(11) 99999-9999',
  });
  
  if (registerResult.success) {
    console.log('  ✅ Registro realizado com sucesso');
  } else {
    console.log('  ❌ Erro no registro:', registerResult.data.error);
  }
  
  // Teste de login
  console.log('  🔑 Testando login...');
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@eyewear.com',
    password: 'admin123',
  });
  
  if (loginResult.success) {
    console.log('  ✅ Login realizado com sucesso');
    return loginResult.data.accessToken;
  } else {
    console.log('  ❌ Erro no login:', loginResult.data.error);
    return null;
  }
}

// Função para testar produtos
async function testProducts(token) {
  console.log('\n📦 Testando APIs de Produtos...');
  
  // Listar produtos
  console.log('  📋 Testando listagem de produtos...');
  const productsResult = await makeRequest('GET', '/api/products');
  
  if (productsResult.success) {
    console.log(`  ✅ ${productsResult.data.products.length} produtos encontrados`);
  } else {
    console.log('  ❌ Erro ao listar produtos:', productsResult.data.error);
  }
  
  // Criar produto (apenas admin)
  if (token) {
    console.log('  ➕ Testando criação de produto...');
    const createProductResult = await makeRequest('POST', '/api/products', {
      name: 'Óculos de Teste',
      description: 'Produto criado durante os testes',
      price: 199.99,
      stock: 10,
      sku: 'TEST-001',
      categoryId: '1', // Assumindo que existe uma categoria com ID 1
      brandId: '1', // Assumindo que existe uma marca com ID 1
    }, token);
    
    if (createProductResult.success) {
      console.log('  ✅ Produto criado com sucesso');
    } else {
      console.log('  ❌ Erro ao criar produto:', createProductResult.data.error);
    }
  }
}

// Função para testar carrinho
async function testCart(token) {
  if (!token) {
    console.log('\n🛒 Pulando testes de carrinho (sem token de autenticação)');
    return;
  }
  
  console.log('\n🛒 Testando APIs de Carrinho...');
  
  // Obter carrinho
  console.log('  📋 Testando obtenção do carrinho...');
  const cartResult = await makeRequest('GET', '/api/cart', null, token);
  
  if (cartResult.success) {
    console.log(`  ✅ Carrinho obtido com ${cartResult.data.items.length} itens`);
  } else {
    console.log('  ❌ Erro ao obter carrinho:', cartResult.data.error);
  }
}

// Função para testar pedidos
async function testOrders(token) {
  if (!token) {
    console.log('\n📋 Pulando testes de pedidos (sem token de autenticação)');
    return;
  }
  
  console.log('\n📋 Testando APIs de Pedidos...');
  
  // Listar pedidos
  console.log('  📋 Testando listagem de pedidos...');
  const ordersResult = await makeRequest('GET', '/api/orders', null, token);
  
  if (ordersResult.success) {
    console.log(`  ✅ ${ordersResult.data.orders.length} pedidos encontrados`);
  } else {
    console.log('  ❌ Erro ao listar pedidos:', ordersResult.data.error);
  }
}

// Função para testar APIs administrativas
async function testAdmin(token) {
  if (!token) {
    console.log('\n👑 Pulando testes administrativos (sem token de autenticação)');
    return;
  }
  
  console.log('\n👑 Testando APIs Administrativas...');
  
  // Estatísticas
  console.log('  📊 Testando estatísticas...');
  const statsResult = await makeRequest('GET', '/api/admin/stats', null, token);
  
  if (statsResult.success) {
    console.log('  ✅ Estatísticas obtidas com sucesso');
  } else {
    console.log('  ❌ Erro ao obter estatísticas:', statsResult.data.error);
  }
  
  // Relatório de vendas
  console.log('  📈 Testando relatório de vendas...');
  const salesReportResult = await makeRequest('GET', '/api/admin/reports/sales', null, token);
  
  if (salesReportResult.success) {
    console.log('  ✅ Relatório de vendas obtido com sucesso');
  } else {
    console.log('  ❌ Erro ao obter relatório de vendas:', salesReportResult.data.error);
  }
  
  // Relatório de produtos
  console.log('  📦 Testando relatório de produtos...');
  const productsReportResult = await makeRequest('GET', '/api/admin/reports/products', null, token);
  
  if (productsReportResult.success) {
    console.log('  ✅ Relatório de produtos obtido com sucesso');
  } else {
    console.log('  ❌ Erro ao obter relatório de produtos:', productsReportResult.data.error);
  }
}

// Função principal
async function runTests() {
  console.log('🚀 Iniciando testes das APIs do Backend...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  
  try {
    // Testar autenticação
    const token = await testAuth();
    
    // Testar produtos
    await testProducts(token);
    
    // Testar carrinho
    await testCart(token);
    
    // Testar pedidos
    await testOrders(token);
    
    // Testar APIs administrativas
    await testAdmin(token);
    
    console.log('\n✅ Testes concluídos!');
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
  }
}

// Executar os testes
runTests();

