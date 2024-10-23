import { json } from '@remix-run/node';
import { getProcessingStatus, processPlays } from '~/utils/stats';

export async function loader() {
  try {
    const status = await getProcessingStatus();
    console.log({ status });
    return json(status);
  } catch (error) {
    console.error('Error fetching processing status:', error);
    return json({ error: 'Failed to fetch processing status' }, { status: 500 });
  }
}


export async function action({ request }: { request: Request }) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const forceReprocess = formData.get('forceReprocess') === 'true';

    const result = await processPlays(forceReprocess);
    console.log(result)

    return json({
      success: true,
      songsProcessed: result.songsProcessed,
      duration: result.endTime.getTime() - result.startTime.getTime(),
      startTime: result.startTime,
      endTime: result.endTime,
    });
  } catch (error) {
    console.error('Error processing plays:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
