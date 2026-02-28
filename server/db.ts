import { JSONFilePreset } from 'lowdb/node'

export interface Fund {
  id: string
  fundName: string
  fundCode: string
  cost: number
  shares: number
  createdAt: string
  updatedAt: string
}

export interface Database {
  funds: Fund[]
}

const defaultData: Database = {
  funds: [],
}

let db: Awaited<ReturnType<typeof JSONFilePreset<Database>>> | null = null

export const getDb = async () => {
  if (!db) {
    db = await JSONFilePreset<Database>('db.json', defaultData)
  }
  return db
}
