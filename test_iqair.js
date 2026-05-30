async function test() {
  const token = '8351afd9c57845fd2ada91885f218c3c84856d50afa1fd8f7a0b4551d17d23f0';
  const url = `https://api.airvisual.com/v2/nearest_city?key=${token}`;
  try {
    const res = await fetch(url);
    console.log('IQAir response status:', res.status);
    const data = await res.json();
    console.log('IQAir FULL RESPONSE:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
