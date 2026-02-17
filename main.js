document.addEventListener('DOMContentLoaded', function () {
    const scheduleContainer = document.getElementById('schedule-container');
    const selectedTimeInput = document.getElementById('selected-time');
    const bookingForm = document.getElementById('booking-form');
    const submitButton = document.getElementById('submit-button');
    const confirmationMessage = document.getElementById('confirmation-message');

    // --- Configuration ---
    // In a real application, this would come from a backend.
    // Here we define a static schedule for the next 3 days.
    const schedule = {
        "days": 3,
        "slots": [
            "10:00 - 11:00",
            "11:00 - 12:00",
            "13:00 - 14:00",
            "14:00 - 15:00",
            "15:00 - 16:00",
            "16:00 - 17:00"
        ]
    };

    // --- Generate Time Slots ---
    function generateSchedule() {
        const today = new Date();
        for (let i = 0; i < schedule.days; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayString = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

            const dayDiv = document.createElement('div');
            dayDiv.className = 'schedule-day';
            dayDiv.innerHTML = `<h3>${dayString}</h3>`;

            const slotsDiv = document.createElement('div');
            slotsDiv.className = 'time-slots';
            
            schedule.slots.forEach(slot => {
                const slotEl = document.createElement('div');
                slotEl.className = 'time-slot';
                slotEl.textContent = slot;
                slotEl.dataset.datetime = `${date.toISOString().split('T')[0]} ${slot}`;
                slotsDiv.appendChild(slotEl);
            });

            dayDiv.appendChild(slotsDiv);
            scheduleContainer.appendChild(dayDiv);
        }
    }

    // --- Event Listeners ---
    scheduleContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('time-slot') && !e.target.classList.contains('disabled')) {
            // Clear previous selection
            const currentSelected = document.querySelector('.time-slot.selected');
            if (currentSelected) {
                currentSelected.classList.remove('selected');
            }

            // Mark new selection
            e.target.classList.add('selected');
            
            // Update form
            selectedTimeInput.value = e.target.dataset.datetime;
            submitButton.disabled = false;
        }
    });

    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent default submission

        const form = e.target;
        const data = new FormData(form);
        const selectedSlot = document.querySelector('.time-slot.selected');

        // Show loading state on button (optional)
        submitButton.textContent = '처리 중...';
        submitButton.disabled = true;

        fetch(form.action, {
            method: form.method,
            body: data,
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                // Success!
                bookingForm.style.display = 'none';
                confirmationMessage.style.display = 'block';
                if (selectedSlot) {
                    selectedSlot.classList.add('disabled');
                    selectedSlot.classList.remove('selected');
                }
            } else {
                // Error
                response.json().then(data => {
                    if (Object.hasOwn(data, 'errors')) {
                        alert(data["errors"].map(error => error["message"]).join(", "));
                    } else {
                        alert('예약 중 오류가 발생했습니다. 다시 시도해주세요.');
                    }
                });
                // Restore button
                submitButton.textContent = '예약하기';
                submitButton.disabled = false;
            }
        }).catch(error => {
            alert('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
            // Restore button
            submitButton.textContent = '예약하기';
            submitButton.disabled = false;
        });
    });

    // --- Initial Call ---
    generateSchedule();
});
