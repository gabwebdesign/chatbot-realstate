function extractWasiLink(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    
    if (matches) {
        const wasiLink = matches.find(link => link.includes(process.env.WASI_URL));
        return wasiLink || null;
    }
    return null;
}

export default extractWasiLink;