function getDataTable({ id, url, columns, filters = {}, body = {} }) {
    const table = $(id).DataTable({
        pageLength: 10,
        autoWidth: false,
        processing: true,
        serverSide: true,
        order: [[0, 'desc']],
        ajax: $.fn.dataTable.pipeline({
            url: url,
            pages: 5,
            data: (data) => {
                data.filter_options = filters;
                for (let key in body) data[key] = body[key];
            },
        }),
        drawCallback: function (settings) {
            console.log('drawCallback', settings);
            const allSliders = document.querySelectorAll('.my-slider');
            allSliders.forEach((slider) => {
                const nextBtn = slider.querySelector('.slider-next-btn');
                const prevBtn = slider.querySelector('.slider-prev-btn');
                const tnss = tns({
                    container: slider,
                    autoplay: false,
                    controls: true,
                    autoplayTimeout: 1800,
                    speed: 2000,
                    nav: true,
                    navPosition: 'bottom',
                    dots: true,
                    mouseDrag: true,
                    center: true,
                    controlsText: [
                        `<span class="fs-3x">
					        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16">
					        <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
					    </svg>`,
                        `<span class=" fs-3x">
					    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16">
					        <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
					    </svg>
					</span>`,
                    ],
                    prevButton: prevBtn,
                    nextButton: nextBtn,
                });

                console.log('tnss', tnss);
            });
        },
        columns: columns,
        language: {
            processing: '<div class="d-flex align-items-center justify-content-center gap-3 py-2"><div class="spinner-border text-primary" style="width:1.75rem;height:1.75rem;border-width:3px;" role="status"><span class="visually-hidden">Loading...</span></div><span class="text-muted fs-7 fw-semibold">Loading...</span></div>',
            paginate: {
                previous: "<i class='mdi mdi-chevron-left'>",
                next: "<i class='mdi mdi-chevron-right'>",
            },
        },
        columnDefs: [
            {
                targets: 'no_sort',
                orderable: false,
            },
        ],
    });

    return table;
} 