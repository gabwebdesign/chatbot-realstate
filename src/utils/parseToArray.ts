const parseToArray = (data: any) => {
    const list = Object.values(data).filter(element => typeof element === "object" && element !== null);
    if (!Array.isArray(list)) {
        console.error("❌ Error: 'list' no es un array.");
        return [];
    }
    //console.log("✅ 'list' es un array.");
    return list;
};

export default parseToArray;