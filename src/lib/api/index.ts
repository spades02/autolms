
export async function chatgpt({ resources } : {resources: string}){
    const response = await fetch("/api/chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            resources: resources,
        }),
    });
    const data = await response.json();

    return data;
}