document.getElementById("imgInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const preview = document.getElementById("imgPreview");
    preview.src = URL.createObjectURL(file);
    preview.classList.remove("hidden");
});

const ageSelect = document.getElementById("ageSelect");

for (let age = 0; age <= 35; age++) {
  const option = document.createElement("option");
  option.value = age;
  option.textContent = `${age}歳`;
  ageSelect.appendChild(option);
}

const manthSelect = document.getElementById("manthSelect");

for (let manth = 0; manth <= 11; manth++) {
  const option = document.createElement("option");
  option.value = manth;
  option.textContent = `${manth}ヶ月`;
  manthSelect.appendChild(option);
}