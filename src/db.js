import { openDB } from 'idb'

const DB_NAME = 'vku-job-survey-db'
const STORE_NAME = 'surveys'

export const dbPromise = openDB(
  DB_NAME,
  1,
  {
    upgrade(db) {
      if (
        !db.objectStoreNames.contains(
          STORE_NAME,
        )
      ) {
        const store =
          db.createObjectStore(
            STORE_NAME,
            {
              keyPath: 'sessionId',
            },
          )

        store.createIndex(
          'status',
          'status',
        )

        store.createIndex(
          'createdAt',
          'createdAt',
        )
      }
    },
  },
)

export async function saveSurvey(
  survey,
) {
  const db = await dbPromise

  await db.put(
    STORE_NAME,
    survey,
  )

  return survey
}

export async function getAllSurveys() {
  const db = await dbPromise

  return db.getAll(STORE_NAME)
}

export async function getPendingSurveys() {
  const db = await dbPromise

  return db.getAllFromIndex(
    STORE_NAME,
    'status',
    'PENDING',
  )
}