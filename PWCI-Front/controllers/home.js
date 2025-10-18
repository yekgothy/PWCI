// Cargar navbar
fetch('../components/navbar.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('navbar').innerHTML = data;
    // Ejecutar el JavaScript del navbar directamente
    initNavbar();
  });

// Cargar footer
fetch('../components/footer.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('footer').innerHTML = data;
  });
