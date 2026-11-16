// Agafem els elements HTML
const registerForm = document.getElementById("registerForm");
const course = document.getElementById("course");
const estudis = document.getElementById("estudis");
const registerMessage = document.getElementById("registerMessage");


// Opcions segons el tipus d'estudis
const opcions = {
    batxillerat: [
        "Ciències i Tecnologia",
        "Humanitats i Ciències Socials",
        "Arts",
        "General"
    ],
    fp_basica: [
        "Servicis Administratius (presencial)"
    ],
    mitja: [
        "Sistemes Microinformàtics i Xarxes (presencial)",
        "Gestió Administrativa (presencial)",
        "Gestió Administrativa (semipresencial)",
        "Activitats Comercials (presencial)"
    ],
    superior: [
        "DAW: Desenvolupament d'Aplicacions Web (semipresencial)",
        "DAM: Desenvolupament d'Aplicacions Multiplataforma (presencial)",
        "Comerç Internacional (presencial)",
        "Administració i Finances (presencial)",
        "Transport i Logística (presencial)"
    ]
};


// QUAN CANVIA EL TIPUS D'ESTUDIS
course.addEventListener("change", function () {

    // Borrem les opcions anteriors
    estudis.innerHTML = '<option value="">Selecciona els estudis</option>';

    // Afegim les opcions corresponents
    (opcions[course.value] || []).forEach(function (nom) {
        const opcio = document.createElement("option");
        opcio.value = nom;
        opcio.textContent = nom;
        estudis.appendChild(opcio);
    });
});


// QUAN S'ENVIA EL FORMULARI
registerForm.addEventListener("submit", async function (e) {

    // Evitem que la pàgina es recarregue
    e.preventDefault();

    // Agafem les dades del formulari
    const firstName = document.getElementById("first-name").value;
    const lastName = document.getElementById("last-name").value;
    const email = document.getElementById("email").value;
    const nia = document.getElementById("nia").value;
    const car = document.getElementById("car").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const terms = document.querySelector('input[name="terms"]').checked;


    // Comprovem 
    if (!terms) {
        registerMessage.textContent = "Has d'acceptar els termes d'ús";
        return;
    }

  
    if (password !== confirmPassword) {
        registerMessage.textContent = "Les contrasenyes no coincideixen";
        return;
    }
   

    if (!estudis.value) {
        registerMessage.textContent = "Selecciona els estudis concrets";
        return;
    }

    
    if (!car.trim()) {
        registerMessage.textContent = "Introdueix la matrícula del vehicle";
        return;
    }


    // Enviem les dades al servidor
    try {
        const res = await fetch("http://localhost:3000/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({
                firstName,
                lastName,
                email,
                course: course.value,
                estudis: estudis.value,
                nia,
                car,
                password,
                confirmPassword
            })
        });

        const data = await res.json().catch(() => ({}));

        // Si hi ha un error
        if (!res.ok) {
            registerMessage.textContent = data.message || "No s'ha pogut crear el compte";
            return;
        }

        // Si tot ha anat bé
        registerMessage.textContent = "Compte creat correctament!";

        setTimeout(function () {
            window.location.href = "login.html";
        }, 1500);

    } catch (error) {
        console.error(error);
        registerMessage.textContent = "Error de connexió amb el servidor";
    }
});