import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 生成随机手机号
function generatePhone(): string {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139',
                    '150', '151', '152', '153', '155', '156', '157', '158', '159',
                    '180', '181', '182', '183', '184', '185', '186', '187', '188', '189']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
  return prefix + suffix
}

// 生成随机昵称
function generateNickname(): string {
  const surnames = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴']
  const names = ['梓涵', '雨轩', '子涵', '浩宇', '浩然', '梓轩', '子轩', '诗涵', '雨萱', '宇轩']
  return surnames[Math.floor(Math.random() * surnames.length)] +
         names[Math.floor(Math.random() * names.length)]
}

// 生成票号
function generateTicketCode(eventId: number, tierId: number, index: number): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `E${eventId}T${tierId}-${timestamp}-${random}-${index}`
}

async function main() {
  console.log('开始生成票务数据...\n')

  // 获取或创建一些测试用户
  const existingUsers = await prisma.user.findMany({
    where: { role: 'user' },
    take: 20
  })

  let users = existingUsers

  // 如果用户不够，创建一些测试用户
  if (users.length < 20) {
    console.log(`当前用户数量: ${users.length}，创建更多测试用户...`)
    const newUsersCount = 20 - users.length
    const newUsers = []

    for (let i = 0; i < newUsersCount; i++) {
      const phone = generatePhone()
      const user = await prisma.user.create({
        data: {
          phone,
          nickname: generateNickname(),
          role: 'user'
        }
      })
      newUsers.push(user)
    }
    users = [...users, ...newUsers]
    console.log(`已创建 ${newUsersCount} 个测试用户\n`)
  }

  // 获取所有活动和票档
  const events = await prisma.event.findMany({
    include: {
      tiers: true
    }
  })

  console.log(`找到 ${events.length} 个活动\n`)

  let totalTicketsCreated = 0
  let totalOrdersCreated = 0

  // 为每个活动生成票务数据
  for (const event of events) {
    console.log(`\n处理活动: ${event.name}`)

    for (const tier of event.tiers) {
      console.log(`  票档: ${tier.name} (容量: ${tier.capacity})`)

      const capacity = tier.capacity

      // 模拟不同的销售情况
      const soldCount = Math.floor(capacity * (0.3 + Math.random() * 0.4)) // 30%-70%已售
      const heldCount = Math.floor(capacity * 0.05) // 5%锁定中
      const refundedCount = Math.floor(soldCount * 0.05) // 已售的5%退款
      const availableCount = capacity - soldCount - heldCount

      console.log(`    - 可售: ${availableCount}`)
      console.log(`    - 锁定中: ${heldCount}`)
      console.log(`    - 已售: ${soldCount}`)
      console.log(`    - 已退款: ${refundedCount}`)

      const tickets = []
      let ticketIndex = 0

      // 生成可售票
      for (let i = 0; i < availableCount; i++) {
        tickets.push({
          ticketCode: generateTicketCode(event.id, tier.id, ticketIndex++),
          eventId: event.id,
          tierId: tier.id,
          status: 'available',
          price: tier.price
        })
      }

      // 批量创建可售票
      await prisma.ticket.createMany({
        data: tickets
      })
      totalTicketsCreated += tickets.length

      // 生成锁定中的票 (创建Hold和对应的Ticket)
      for (let i = 0; i < heldCount; i++) {
        const user = users[Math.floor(Math.random() * users.length)]
        const holdId = `HOLD-${event.id}-${tier.id}-${Date.now()}-${i}`

        // 创建Hold记录
        const expireAt = Date.now() + 15 * 60 * 1000 // 15分钟后过期
        await prisma.hold.create({
          data: {
            id: holdId,
            eventId: event.id.toString(),
            tierId: tier.id.toString(),
            qty: 1,
            expireAt: BigInt(expireAt),
            createdAt: BigInt(Date.now())
          }
        })

        // 创建对应的票
        await prisma.ticket.create({
          data: {
            ticketCode: generateTicketCode(event.id, tier.id, ticketIndex++),
            eventId: event.id,
            tierId: tier.id,
            status: 'held',
            price: tier.price,
            userId: user.id,
            holdId: holdId
          }
        })
        totalTicketsCreated++
      }

      // 生成已售和退款的订单
      const orderBatchSize = Math.floor(soldCount / 3) // 每个订单平均购买3张票
      const actualOrders = Math.max(1, orderBatchSize)

      for (let i = 0; i < actualOrders; i++) {
        const user = users[Math.floor(Math.random() * users.length)]
        const qty = Math.min(Math.floor(1 + Math.random() * 4), soldCount - i * 3) // 1-4张票

        if (qty <= 0) break

        const isRefunded = i < Math.floor(actualOrders * 0.05) // 5%的订单退款

        // 为订单创建Hold
        const holdId = `HOLD-${event.id}-${tier.id}-${Date.now()}-ORDER-${i}`
        const createdAt = Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        const paidAt = isRefunded
          ? Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          : Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000

        // 创建订单
        const orderId = `ORDER-${event.id}-${tier.id}-${Date.now()}-${i}`
        await prisma.order.create({
          data: {
            id: orderId,
            userId: user.id,
            eventId: event.id.toString(),
            tierId: tier.id.toString(),
            holdId: holdId,
            qty,
            status: isRefunded ? 'refunded' : 'completed',
            createdAt: BigInt(Math.floor(createdAt)),
            paidAt: BigInt(Math.floor(paidAt))
          }
        })

        totalOrdersCreated++

        // 为订单创建对应的票
        const orderTickets = []
        const refundedAt = isRefunded ? new Date() : undefined
        for (let j = 0; j < qty; j++) {
          orderTickets.push({
            ticketCode: generateTicketCode(event.id, tier.id, ticketIndex++),
            eventId: event.id,
            tierId: tier.id,
            orderId: orderId,
            userId: user.id,
            status: isRefunded ? 'refunded' : 'sold',
            price: tier.price,
            purchasedAt: new Date(paidAt),
            refundedAt: refundedAt
          })
        }

        await prisma.ticket.createMany({
          data: orderTickets
        })
        totalTicketsCreated += orderTickets.length
      }
    }
  }

  console.log('\n=================================')
  console.log('票务数据生成完成!')
  console.log(`总共创建了 ${totalTicketsCreated} 张票`)
  console.log(`总共创建了 ${totalOrdersCreated} 个订单`)
  console.log('=================================\n')

  // 显示统计信息
  const stats = await prisma.ticket.groupBy({
    by: ['status'],
    _count: true
  })

  console.log('票务状态统计:')
  stats.forEach(stat => {
    console.log(`  ${stat.status}: ${stat._count}`)
  })
}

main()
  .catch((e) => {
    console.error('错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
