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

    // Guardem el tipus seleccionat
    const tipusSeleccionat = course.value;

    // Afegim les opcions corresponents
    if (opcions[tipusSeleccionat]) {

        for (let i = 0; i < opcions[tipusSeleccionat].length; i++) {

            const opcio = document.createElement("option");

            opcio.value = opcions[tipusSeleccionat][i];
            opcio.textContent = opcions[tipusSeleccionat][i];

            estudis.appendChild(opcio);
        }
    }
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


    // Comprovem els termes
    if (!terms) {
        registerMessage.textContent = "Has d'acceptar els termes d'ús";
        return;
    }

    // Comprovem les contrasenyes
    if (password !== confirmPassword) {
        registerMessage.textContent = "Les contrasenyes no coincideixen";
        return;
    }

    // Comprovem que s'hagin seleccionat els estudis concrets
    if (!estudis.value) {
        registerMessage.textContent = "Selecciona els estudis concrets";
        return;
    }

    // Comprovem la matrícula
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
                firstName: firstName,
                lastName: lastName,
                email: email,
                course: course.value,
                estudis: estudis.value,
                nia: nia,
                car: car,
                password: password,
                confirmPassword: confirmPassword
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