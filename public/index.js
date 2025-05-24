async function getCached() {
    const res = await fetch('/api?forceCache=true');
    const cache = await res.json();
    console.log(cache);
}

async function getData() {
    const res = await fetch('/api');
    const data = await res.json();
    console.log(data);
}

getCached();
getData();