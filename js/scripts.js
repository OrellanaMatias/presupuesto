fetch("https://dolarapi.com/v1/dolares/oficial")
    .then(response => response.json())
    .then(data => {
        const dolarVenta = data.venta;
        console.log("Valor del dólar:", dolarVenta);

        $.getJSON('servicios.json', function(servicios) {
            let serviciosHTML = '';
            servicios.forEach(function(servicio) {
                const precioEnPesos = (servicio.precio * dolarVenta).toFixed(2);
                serviciosHTML += `
                    <tr>
                        <td>${servicio.servicio}</td>
                        <td>$ ${parseFloat(precioEnPesos).toLocaleString('es-AR')}</td>
                        <td>
                            <div class="form-outline">
                                <input type="number" class="form-control" min="1" max="999" value="1">
                            </div>
                        </td>
                        <td>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" value="${servicio.servicio}" value2="${precioEnPesos}">
                            </div>
                        </td>
                    </tr>`;
            });
            $('#serviciosBody').html(serviciosHTML);
        });
    })
    .catch(error => console.error('Error al obtener el valor del dólar:', error));

function normalizeString(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function filterServices() {
    const searchTerm = normalizeString($('#search').val());
    $('#serviciosBody tr').filter(function() {
        const serviceText = normalizeString($(this).text());
        $(this).toggle(serviceText.indexOf(searchTerm) > -1);
    });
}

let selectedServices = [];

function updateSelectedServices() {
    selectedServices = [];
    $('#serviciosBody input:checked').each(function() {
        const serviceName = $(this).attr('value');
        const servicePrice = parseFloat($(this).attr('value2'));
        selectedServices.push({ name: serviceName, price: servicePrice });
    });
}

function contar() {
    updateSelectedServices();
    let total = 0;
    let servicesText = '';

    selectedServices.forEach(service => {
        const cantidadInput = $('#serviciosBody input[value="' + service.name + '"]').closest('tr').find('input.form-control');
        const cantidad = parseInt(cantidadInput.val(), 10) || 0;
        const precioTotal = cantidad * service.price;

        if (cantidad > 0) {
            total += precioTotal;
            servicesText += `<p>${service.name} (x${cantidad}) - <strong>$ ${parseFloat(precioTotal).toLocaleString('es-AR')}</strong></p>`; // Indica la cantidad aquí
        }
    });

    if (total > 0) {
        document.getElementById('serviciosSeleccionados').innerHTML = servicesText + `<p><strong>Total: $ ${parseFloat(total).toLocaleString('es-AR')}</strong></p>` +
            `<button class="btn btn-success" onclick="generarPresupuesto()">Generar Presupuesto</button>`;
        document.getElementById('presupuestoModal').style.display = 'block';
    } else {
        alert("No hay servicios seleccionados o la cantidad es cero.");
    }
}

function cerrarModal() {
    $('#presupuestoModal').modal('hide');
}

function generarPresupuesto() {
    updateSelectedServices();
    if (selectedServices.length === 0) {
        alert("No hay servicios seleccionados para generar el presupuesto.");
        return;
    }

    let total = 0;
    let servicesText = '';

    selectedServices.forEach(service => {
        const cantidadInput = $('#serviciosBody input[value="' + service.name + '"]').closest('tr').find('input.form-control');
        const cantidad = parseInt(cantidadInput.val(), 10) || 0;
        const precioTotal = service.price * cantidad;
        total += precioTotal;
        servicesText += `${service.name} (x${cantidad}) - $ ${parseFloat(precioTotal).toLocaleString('es-AR')}\\n`; // Indica la cantidad aquí
    });

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const logo = new Image();
    logo.src = 'img/logo.png';
    logo.onload = function() {
        doc.addImage(logo, 'PNG', 10, 10, 30, 30);
        doc.setFontSize(18);
        doc.text('Jace - SI', 50, 20);

        doc.setFontSize(10);
        doc.text('Contacto: jace.it@icloud.com', 200, 20, { align: 'right' });
        doc.text('Teléfono: +54 9 11 6650 - 0636', 200, 25, { align: 'right' });
        doc.text('YouTube: Jace Tutoriales', 200, 30, { align: 'right' });
        doc.text('Facebook: Jace - SI', 200, 35, { align: 'right' });
        doc.text('Instagram: @jace.si', 200, 40, { align: 'right' });

        doc.line(10, 60, 200, 60);

        doc.setFontSize(16);
        doc.text('Presupuesto', 10, 70);

        const fecha = new Date();
        const fechaStr = `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
        const horaStr = `${fecha.getHours()}:${fecha.getMinutes().toString().padStart(2, '0')}`;
        doc.setFontSize(12);
        doc.text(`Fecha de generación: ${fechaStr} ${horaStr}`, 10, 80);

        let yOffset = 90;
        doc.setFontSize(14);
        doc.text('Servicios Seleccionados:', 10, yOffset);
        yOffset += 10;

        doc.setFontSize(12);
        selectedServices.forEach(service => {
            const cantidadInput = $('#serviciosBody input[value="' + service.name + '"]').closest('tr').find('input.form-control');
            const cantidad = parseInt(cantidadInput.val(), 10) || 0;
            const precioTotal = service.price * cantidad;
            const maxWidth = 130;
            const splitServiceName = doc.splitTextToSize(`${service.name} (x${cantidad})`, maxWidth);
            splitServiceName.forEach(line => {
                doc.text(line, 10, yOffset);
                yOffset += 7;
            });

            doc.setFont('helvetica', 'bold');
            doc.text(`$ ${parseFloat(precioTotal).toLocaleString('es-AR')}`, 190, yOffset - 7, { align: 'right' });
            doc.setFont('helvetica', 'normal');
        });

        yOffset += 10;
        doc.setFont('helvetica', 'bold');
        doc.text(`Total: $ ${parseFloat(total).toLocaleString('es-AR')}`, 10, yOffset);

        doc.save(`presupuesto_${fechaStr}.pdf`);
    };
}
