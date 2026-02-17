// functions/api/bookings.js

/**
 * Handles GET requests to fetch all bookings.
 * @param {object} context - The Cloudflare Functions context.
 */
async function handleGet(context) {
    try {
        const { XR_BOOKINGS_KV } = context.env;
        const kvData = await XR_BOOKINGS_KV.get('bookings', { type: 'json' });
        const bookings = kvData || [];
        return new Response(JSON.stringify(bookings), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        console.error('KV GET Error:', error);
        return new Response('Error fetching bookings', { status: 500 });
    }
}

/**
 * Handles POST requests to create a new booking.
 * @param {object} context - The Cloudflare Functions context.
 */
async function handlePost(context) {
    try {
        const { request, env } = context;
        const { XR_BOOKINGS_KV } = env;
        const newBooking = await request.json();

        if (!newBooking.name || !newBooking.email || !newBooking.selected_time) {
            return new Response(JSON.stringify({ message: 'All fields are required.' }), { status: 400 });
        }

        const currentBookings = (await XR_BOOKINGS_KV.get('bookings', { type: 'json' })) || [];

        const isSlotTaken = currentBookings.some(booking => booking.selected_time === newBooking.selected_time);
        if (isSlotTaken) {
            return new Response(JSON.stringify({ message: 'This time slot is no longer available. Please select another time.' }), {
                status: 409, // Conflict
                headers: { 'Content-Type': 'application/json' },
            });
        }

        currentBookings.push(newBooking);

        await XR_BOOKINGS_KV.put('bookings', JSON.stringify(currentBookings));

        return new Response(JSON.stringify(newBooking), {
            headers: { 'Content-Type': 'application/json' },
            status: 201, // Created
        });

    } catch (error) {
        console.error('KV POST Error:', error);
        return new Response('Error saving booking', { status: 500 });
    }
}

/**
 * The main onRequest handler for the function.
 * Distinguishes between GET and POST requests.
 */
export async function onRequest(context) {
    if (context.request.method === 'GET') {
        return handleGet(context);
    } else if (context.request.method === 'POST') {
        return handlePost(context);
    } else {
        return new Response(`${context.request.method} is not allowed.`, {
            status: 405, // Method Not Allowed
        });
    }
}
