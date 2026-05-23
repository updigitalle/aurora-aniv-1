const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seed do banco de dados...');

  // 1. Criar Evento Inicial (Aniversário da Aurora)
  const eventDate = new Date();
  eventDate.setMonth(eventDate.getMonth() + 4); // festa daqui a 4 meses
  eventDate.setHours(16, 0, 0, 0); // 16h

  const event = await prisma.event.upsert({
    where: { slug: 'aurora-1-ano' },
    update: {},
    create: {
      name: 'Aniversário de 1 Ano da Princesa Aurora',
      slug: 'aurora-1-ano',
      babyName: 'Aurora',
      date: eventDate,
      locationName: 'Castelinho Real Eventos',
      locationAddress: 'Alameda dos Bosques, 1500 - Jardim das Flores, São Paulo - SP',
      locationMapUrl: 'https://maps.google.com',
      description: 'Venha celebrar conosco o primeiro aninho da nossa princesinha Aurora! Preparem-se para um dia mágico no reino das princesas.',
      bgImage: '',
    },
  });
  console.log(`Evento criado/atualizado: ${event.name} (${event.id})`);

  // Limpar tabelas para evitar duplicações no seed
  await prisma.task.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.guest.deleteMany({});

  // 2. Criar Tarefas Iniciais (Checklist)
  const tasks = [
    { title: 'Definir lista de convidados inicial', category: 'Convites', priority: 'alta', completed: true },
    { title: 'Testar e configurar o site do convite', category: 'Convites', priority: 'alta', completed: false },
    { title: 'Enviar link do convite/RSVP no WhatsApp dos familiares', category: 'Convites', priority: 'alta', completed: false },
    { title: 'Escolher e encomendar o bolo decorado de princesa', category: 'Comida', priority: 'alta', completed: false },
    { title: 'Contratar serviço de buffet / salgadinhos', category: 'Comida', priority: 'alta', completed: false },
    { title: 'Comprar sucos, refrigerantes e água', category: 'Comida', priority: 'media', completed: false },
    { title: 'Confirmar aluguel do salão de festas', category: 'Espaço', priority: 'alta', completed: true },
    { title: 'Contratar decoração temática das princesas', category: 'Decoração', priority: 'alta', completed: false },
    { title: 'Encomendar arco de balões desconstruído (tons pastel)', category: 'Decoração', priority: 'media', completed: false },
    { title: 'Escolher o vestido de princesa da Aurora', category: 'Vestuário', priority: 'alta', completed: false },
    { title: 'Escolher as roupas dos pais para o dia da festa', category: 'Vestuário', priority: 'baixa', completed: false },
    { title: 'Contratar fotógrafo profissional', category: 'Serviços', priority: 'alta', completed: false },
    { title: 'Montar lembrancinhas personalizadas das princesas', category: 'Geral', priority: 'media', completed: false },
  ];

  for (const t of tasks) {
    await prisma.task.create({ data: t });
  }
  console.log('Checklist inicial criado com 13 tarefas.');

  // 3. Criar Fornecedores Exemplo
  const vendor1 = await prisma.vendor.create({
    data: {
      name: 'Delícias Reais Buffet & Doces',
      service: 'Buffet & Docinhos',
      phone: '11999998888',
      email: 'contato@deliciasreais.com.co',
      status: 'contratado',
      agreedValue: 3500.00,
      notes: 'Salgadinhos fritos na hora, mini hambúrguer, crepes e docinhos tradicionais.',
    }
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      name: 'Estúdio Magia & Foco',
      service: 'Fotografia',
      phone: '11988887777',
      email: 'contato@magiaefoco.com',
      status: 'a_cotar',
      agreedValue: 1200.00,
      notes: 'Incluso 4 horas de cobertura e link com fotos tratadas.',
    }
  });

  console.log('Fornecedores criados.');

  // 4. Criar Despesas Exemplo (Orçamento)
  const expenses = [
    {
      description: 'Salão Castelinho Real (Aluguel)',
      category: 'Espaço',
      plannedValue: 2000.00,
      actualValue: 2000.00,
      paid: true,
    },
    {
      description: 'Buffet Completo e Doces',
      category: 'Comida',
      plannedValue: 3500.00,
      actualValue: 3500.00,
      paid: false,
      vendorId: vendor1.id,
    },
    {
      description: 'Fotógrafo profissional (Estúdio Magia & Foco)',
      category: 'Serviços',
      plannedValue: 1200.00,
      actualValue: 0.00,
      paid: false,
      vendorId: vendor2.id,
    },
    {
      description: 'Bolo Decorado Princesa Aurora',
      category: 'Comida',
      plannedValue: 500.00,
      actualValue: 450.00,
      paid: false,
    },
    {
      description: 'Decoração Temática Completa',
      category: 'Decoração',
      plannedValue: 1800.00,
      actualValue: 1800.00,
      paid: true,
    },
    {
      description: 'Lembrancinhas das Princesas',
      category: 'Geral',
      plannedValue: 400.00,
      actualValue: 0.00,
      paid: false,
    }
  ];

  for (const exp of expenses) {
    await prisma.expense.create({ data: exp });
  }
  console.log('Despesas iniciais criadas.');

  // 5. Criar alguns Convidados de exemplo
  const guests = [
    {
      name: 'Vovó Maria e Vovô José',
      phone: '11977776666',
      adultsCount: 2,
      childrenCount: 0,
      status: 'confirmado',
      origin: 'manual',
      notes: 'Sentar próximo ao ar condicionado.',
      eventId: event.id,
    },
    {
      name: 'Tia Camila e Família',
      phone: '11966665555',
      adultsCount: 2,
      childrenCount: 2,
      status: 'confirmado',
      origin: 'rsvp_online',
      notes: 'Restrição alimentar: Gabriel é alérgico a amendoim.',
      eventId: event.id,
      respondedAt: new Date(),
    },
    {
      name: 'Amigo Lucas Silva',
      phone: '11955554444',
      adultsCount: 1,
      childrenCount: 0,
      status: 'pendente',
      origin: 'rsvp_online',
      eventId: event.id,
    }
  ];

  for (const g of guests) {
    await prisma.guest.create({ data: g });
  }
  console.log('Convidados de teste criados.');

  console.log('Banco de dados semeado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
