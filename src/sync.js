import {
  getPendingSurveys,
  saveSurvey,
} from './db'

import {
  GOOGLE_SCRIPT_URL,
} from './config'

export async function syncPendingSurveys() {
  const pendingSurveys =
    await getPendingSurveys()

  if (pendingSurveys.length === 0) {
    return {
      success: true,
      count: 0,
    }
  }

  let syncedCount = 0

  for (const survey of pendingSurveys) {
    try {
      const response = await fetch(
  GOOGLE_SCRIPT_URL,
  {
    method: 'POST',

    headers: {
      'Content-Type':
        'application/json',
    },

    body: JSON.stringify(
      survey,
    ),
  },
)

      const result = await response.json()

      console.log(
        'Worker response:',
        result,
      )

      if (result.success === true) {
        await saveSurvey({
          ...survey,
          status: 'SYNCED',
          syncedAt: new Date().toISOString(),
        })

        syncedCount++
      }
    } catch (error) {
      console.error(
        `Sync failed: ${survey.sessionId}`,
        error,
      )
    }
  }

  return {
    success: true,
    count: syncedCount,
  }
}