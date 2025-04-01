/*function Login() {
    const username = document.getElementById('username').value
    const password = document.getElementById('password').value
    console.log(username, password);
    let credintionel = btoa(`${username}:${password}`);

    fetch("https://learn.zone01oujda.ma/api/auth/signin",{
        method: "POST",
        headers:{
            "Authorization":`Basic ${credintionel}`,
            "Content-Type":"application/json"
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log("API Response:",data);
        
    })
    console.log(username, password);
}*/