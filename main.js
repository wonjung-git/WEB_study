document.addEventListener('DOMContentLoaded', function () {
    const scheduleContainer = document.getElementById('schedule-container');
    const selectedTimeInput = document.getElementById('selected-time');
    const bookingForm = document.getElementById('booking-form');
    const submitButton = document.getElementById('submit-button');
    const confirmationMessage = document.getElementById('confirmation-message');

    // Formspree URL for additional notification
    const FORMSPREE_URL = "https://formspree.io/f/mgolyrjb";

    // --- Configuration ---
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
    
    // --- Load Bookings and Update UI ---
    async function loadBookings() {
        try {
            const response = await fetch('/api/bookings');
            const bookings = await response.json();
            
            bookings.forEach(booking => {
                const slotEl = document.querySelector(`.time-slot[data-datetime="${booking.selected_time}"]`);
                if (slotEl) {
                    slotEl.classList.add('disabled');
                }
            });
        } catch (error) {
            console.error('Error loading bookings:', error);
        }
    }

    // --- Event Listeners ---
    scheduleContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('time-slot') && !e.target.classList.contains('disabled')) {
            const currentSelected = document.querySelector('.time-slot.selected');
            if (currentSelected) {
                currentSelected.classList.remove('selected');
            }
            e.target.classList.add('selected');
            selectedTimeInput.value = e.target.dataset.datetime;
            submitButton.disabled = false;
        }
    });

    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('user-name').value;
        const email = document.getElementById('user-email').value;
        const selected_time = selectedTimeInput.value;
        
        if(!selected_time) {
            alert('시간을 선택해주세요.');
            return;
        }

        submitButton.textContent = '처리 중...';
        submitButton.disabled = true;

        try {
            // First, send to our Cloudflare Function for booking persistence
            const cfResponse = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, selected_time })
            });

            if (!cfResponse.ok) {
                const errorData = await cfResponse.json();
                alert(errorData.message || '예약 중 오류가 발생했습니다.');
                await loadBookings(); // Refresh bookings to get the latest status
                submitButton.textContent = '예약하기';
                submitButton.disabled = false;
                return; // Stop if Cloudflare Function booking failed
            }

            // If Cloudflare Function booking was successful, send to Formspree for notification
            const formspreeData = new FormData();
            formspreeData.append('name', name);
            formspreeData.append('email', email);
            formspreeData.append('selected_time', selected_time);

            fetch(FORMSPREE_URL, {
                method: 'POST',
                body: formspreeData,
                headers: {
                    'Accept': 'application/json'
                }
            }).then(formspreeResponse => {
                if (!formspreeResponse.ok) {
                    console.error('Formspree notification failed. Status:', formspreeResponse.status);
                    // Optionally alert user or log server-side if critical
                }
            }).catch(formspreeError => {
                console.error('Formspree network error:', formspreeError);
            });

            // UI updates after successful Cloudflare Function booking
            bookingForm.style.display = 'none';
            confirmationMessage.style.display = 'block';
            const selectedSlot = document.querySelector('.time-slot.selected');
            if (selectedSlot) {
                selectedSlot.classList.add('disabled');
                selectedSlot.classList.remove('selected');
            }

        } catch (error) {
            console.error('Error submitting booking:', error);
            alert('네트워크 오류가 발생했습니다.');
            submitButton.textContent = '예약하기';
            submitButton.disabled = false;
        }
    });

    // --- Initial Call ---
    async function initialize() {
        generateSchedule();
        await loadBookings();
    }

    initialize();
});
