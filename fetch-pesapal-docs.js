import fetch from 'node-fetch';

async function fetchPesaPalDocs() {
  try {
    const response = await fetch('https://developer.pesapal.com/official-extensions/documentation');
    const html = await response.text();
    
    // Extract relevant sections about M-Pesa/STK push
    const mpesaSection = html.match(/M-Pesa.*?STK.*?push/gi);
    const apiSection = html.match(/API.*?endpoint.*?STK/gi);
    
    console.log('M-Pesa STK Push references found:', mpesaSection);
    console.log('API endpoint references found:', apiSection);
    
    // Look for specific API documentation
    const apiDocs = html.match(/https:\/\/[^"]*api[^"]*pesapal[^"]*/gi);
    console.log('API documentation URLs:', apiDocs);
    
  } catch (error) {
    console.error('Error fetching PesaPal docs:', error.message);
  }
}

fetchPesaPalDocs();
