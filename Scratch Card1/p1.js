       document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const countdownEl = document.getElementById('countdown');
            const hoursEl = document.getElementById('hours');
            const minutesEl = document.getElementById('minutes');
            const secondsEl = document.getElementById('seconds');
            const buyButtons = document.querySelectorAll('.buy-btn');
            const ticketGrid = document.getElementById('ticketGrid');
            const noTicketsMessage = document.getElementById('noTicketsMessage');
            const paymentModal = document.getElementById('paymentModal');
            const winningModal = document.getElementById('winningModal');
            const closeModal = document.querySelectorAll('.close-modal');
            const selectedTierEl = document.getElementById('selectedTier');
            const selectedPriceEl = document.getElementById('selectedPrice');
            const payNowBtn = document.getElementById('payNowBtn');
            const claimBtn = document.getElementById('claimBtn');
            const winAmountEl = document.getElementById('winAmount');
            const notification = document.getElementById('notification');
            const notificationText = document.getElementById('notificationText');
            const tabBtns = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');
            const paymentMethods = document.querySelectorAll('.payment-method');
            const paymentFields = document.querySelectorAll('.payment-fields');
            const redeemAllBtn = document.getElementById('redeemAllBtn');
            const clearAllBtn = document.getElementById('clearAllBtn');
            const totalTicketsEl = document.getElementById('totalTickets');
            const totalWinsEl = document.getElementById('totalWins');
            const totalWinningsEl = document.getElementById('totalWinnings');
            const winRateEl = document.getElementById('winRate');
            const nextDrawDateEl = document.getElementById('nextDrawDate');
            
            // Game State
            let tickets = JSON.parse(localStorage.getItem('lotteryTickets')) || [];
            let selectedTier = '';
            let selectedPrice = 0;
            let stats = JSON.parse(localStorage.getItem('lotteryStats')) || {
                totalTickets: 0,
                totalWins: 0,
                totalWinnings: 0
            };
            
            // Initialize the app
            updateCountdown();
            renderTickets();
            updateStats();
            setupNextDrawDate();
            
            // Set up countdown timer (next draw in 24 hours)
            function updateCountdown() {
                const now = new Date();
                const nextDraw = new Date();
                
                // Set next draw to tomorrow at 8 PM
                nextDraw.setDate(now.getDate() + 1);
                nextDraw.setHours(20, 0, 0, 0);
                
                const diff = nextDraw - now;
                
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                hoursEl.textContent = hours.toString().padStart(2, '0');
                minutesEl.textContent = minutes.toString().padStart(2, '0');
                secondsEl.textContent = seconds.toString().padStart(2, '0');
            }
            
            // Set up next draw date display
            function setupNextDrawDate() {
                const now = new Date();
                const nextDraw = new Date();
                nextDraw.setDate(now.getDate() + 1);
                
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                nextDrawDateEl.textContent = nextDraw.toLocaleDateString('en-IN', options) + ' at 8 PM';
            }
            
            // Update countdown every second
            setInterval(updateCountdown, 1000);
            
            // Tab switching functionality
            tabBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const tabId = this.getAttribute('data-tab');
                    
                    // Update active tab button
                    tabBtns.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Update active tab content
                    tabContents.forEach(content => content.classList.remove('active'));
                    document.getElementById(`${tabId}-tab`).classList.add('active');
                });
            });
            
            // Payment method selection
            paymentMethods.forEach(method => {
                method.addEventListener('click', function() {
                    const methodType = this.getAttribute('data-method');
                    
                    // Update active payment method
                    paymentMethods.forEach(m => m.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Show corresponding payment fields
                    paymentFields.forEach(field => field.style.display = 'none');
                    document.getElementById(`${methodType}Fields`).style.display = 'block';
                });
            });
            
            // Buy button click handlers
            buyButtons.forEach(button => {
                button.addEventListener('click', function() {
                    selectedTier = this.getAttribute('data-tier');
                    selectedPrice = parseInt(this.getAttribute('data-price'));
                    
                    // Format tier name for display
                    let tierName = selectedTier.replace(/_/g, ' ');
                    tierName = tierName.split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                    
                    selectedTierEl.textContent = tierName;
                    selectedPriceEl.textContent = selectedPrice;
                    
                    paymentModal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                });
            });
            
            // Close modal handlers
            closeModal.forEach(btn => {
                btn.addEventListener('click', function() {
                    paymentModal.style.display = 'none';
                    winningModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                });
            });
            
            // Close modal when clicking outside
            window.addEventListener('click', function(event) {
                if (event.target === paymentModal) {
                    paymentModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
                if (event.target === winningModal) {
                    winningModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
            
            // Pay now button handler
            payNowBtn.addEventListener('click', initiatePayment);
            
            // Claim prize button handler
            claimBtn.addEventListener('click', function() {
                winningModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                showNotification('Prize claimed successfully!', 'success');
            });
            
            // Redeem all tickets button
            redeemAllBtn.addEventListener('click', function() {
                let unscratchedTickets = tickets.filter(t => !t.scratched);
                
                if (unscratchedTickets.length === 0) {
                    showNotification('No unscratched tickets to redeem!', 'warning');
                    return;
                }
                
                unscratchedTickets.forEach((ticket, index) => {
                    setTimeout(() => {
                        const ticketIndex = tickets.findIndex(t => t.id === ticket.id);
                        scratchTicket(ticketIndex, true);
                    }, index * 500);
                });
                
                showNotification(`Redeeming ${unscratchedTickets.length} tickets...`, 'info');
            });
            
            // Clear all tickets button
            clearAllBtn.addEventListener('click', function() {
                if (tickets.length === 0) {
                    showNotification('No tickets to clear!', 'warning');
                    return;
                }
                
                if (confirm('Are you sure you want to clear all your tickets?')) {
                    tickets = [];
                    saveTickets();
                    renderTickets();
                    showNotification('All tickets cleared!', 'info');
                }
            });
            
            // Payment function using Razorpay
            function initiatePayment() {
                const name = document.getElementById('name').value.trim();
                const email = document.getElementById('email').value.trim();
                const phone = document.getElementById('phone').value.trim();
                const terms = document.getElementById('terms').checked;
                
                // Simple validation
                if (!name || !email || !phone) {
                    showNotification('Please fill in all fields', 'error');
                    return;
                }
                
                if (!terms) {
                    showNotification('Please agree to the terms & conditions', 'error');
                    return;
                }
                
                if (!validateEmail(email)) {
                    showNotification('Please enter a valid email address', 'error');
                    return;
                }
                
                if (!validatePhone(phone)) {
                    showNotification('Please enter a valid 10-digit phone number', 'error');
                    return;
                }
                
                const options = {
                    "key": "rzp_test_1DP5mmOlF5G5ag", // Test key - replace with your live key in production
                    "amount": selectedPrice * 100, // Amount in paise
                    "currency": "INR",
                    "name": "LuckyDraw Lottery",
                    "description": `${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Ticket Purchase`,
                    "image": "https://example.com/your_logo.jpg",
                    "order_id": "",
                    "handler": function(response) {
                        handlePaymentSuccess(response);
                    },
                    "prefill": {
                        "name": name,
                        "email": email,
                        "contact": phone
                    },
                    "notes": {
                        "tier": selectedTier,
                        "price": selectedPrice
                    },
                    "theme": {
                        "color": "#6e48aa"
                    }
                };
                
                const rzp = new Razorpay(options);
                rzp.open();
                
                rzp.on('payment.failed', function(response) {
                    showNotification(`Payment failed: ${response.error.description}`, 'error');
                });
            }
            
            // Email validation
            function validateEmail(email) {
                const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return re.test(email);
            }
            
            // Phone validation
            function validatePhone(phone) {
                const re = /^[0-9]{10}$/;
                return re.test(phone);
            }
            
            // Handle successful payment
            function handlePaymentSuccess(response) {
                // Create new tickets based on the tier
                let ticketCount = 1;
                let ticketTier = selectedTier;
                
                // Determine how many tickets to create based on tier
                if (selectedTier === 'gold') {
                    ticketCount = 1;
                } else if (selectedTier === 'platinum') {
                    ticketCount = 5;
                } else if (selectedTier === 'diamond') {
                    ticketCount = 1;
                } else if (selectedTier === 'weekly_multi') {
                    ticketCount = 5;
                    ticketTier = 'weekly';
                } else if (selectedTier === 'weekly_vip') {
                    ticketCount = 3;
                    ticketTier = 'weekly';
                } else if (selectedTier === 'jackpot_multi') {
                    ticketCount = 5;
                    ticketTier = 'jackpot';
                } else if (selectedTier === 'jackpot_vip') {
                    ticketCount = 2;
                    ticketTier = 'jackpot';
                }
                
                const newTickets = [];
                
                for (let i = 0; i < ticketCount; i++) {
                    newTickets.push({
                        id: generateTicketId(),
                        tier: ticketTier,
                        scratched: false,
                        isWinner: false,
                        prize: 0,
                        timestamp: new Date().toISOString()
                    });
                }
                
                // Add bonus tickets for certain tiers
                if (selectedTier === 'gold') {
                    newTickets.push({
                        id: generateTicketId(),
                        tier: 'silver',
                        scratched: false,
                        isWinner: false,
                        prize: 0,
                        timestamp: new Date().toISOString()
                    });
                } else if (selectedTier === 'platinum') {
                    newTickets.push({
                        id: generateTicketId(),
                        tier: 'gold',
                        scratched: false,
                        isWinner: false,
                        prize: 0,
                        timestamp: new Date().toISOString()
                    });
                } else if (selectedTier === 'diamond') {
                    newTickets.push({
                        id: generateTicketId(),
                        tier: 'platinum',
                        scratched: false,
                        isWinner: false,
                        prize: 0,
                        timestamp: new Date().toISOString()
                    });
                } else if (selectedTier === 'weekly_multi' || selectedTier === 'weekly_vip') {
                    newTickets.push({
                        id: generateTicketId(),
                        tier: 'silver',
                        scratched: false,
                        isWinner: false,
                        prize: 0,
                        timestamp: new Date().toISOString()
                    });
                } else if (selectedTier === 'jackpot_vip') {
                    // Add weekly entries and scratch cards for VIP jackpot package
                    for (let i = 0; i < 5; i++) {
                        newTickets.push({
                            id: generateTicketId(),
                            tier: 'weekly',
                            scratched: false,
                            isWinner: false,
                            prize: 0,
                            timestamp: new Date().toISOString()
                        });
                    }
                    for (let i = 0; i < 10; i++) {
                        newTickets.push({
                            id: generateTicketId(),
                            tier: 'silver',
                            scratched: false,
                            isWinner: false,
                            prize: 0,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
                
                // Add to existing tickets
                tickets = [...tickets, ...newTickets];
                
                // Update stats
                stats.totalTickets += newTickets.length;
                saveData();
                renderTickets();
                
                // Close modal and reset form
                paymentModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                document.getElementById('name').value = '';
                document.getElementById('email').value = '';
                document.getElementById('phone').value = '';
                document.getElementById('terms').checked = false;
                
                showNotification(`Payment successful! ${newTickets.length} tickets added.`, 'success');
            }
            
            // Generate a random ticket ID
            function generateTicketId() {
                const prefix = {
                    'silver': 'SIL',
                    'gold': 'GLD',
                    'platinum': 'PLT',
                    'diamond': 'DIA',
                    'weekly': 'WLY',
                    'jackpot': 'JP'
                };
                
                const tierPrefix = prefix[selectedTier] || 'TKT';
                return `${tierPrefix}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            }
            
            // Save tickets and stats to localStorage
            function saveData() {
                localStorage.setItem('lotteryTickets', JSON.stringify(tickets));
                localStorage.setItem('lotteryStats', JSON.stringify(stats));
            }
            
            // Save tickets to localStorage
            function saveTickets() {
                localStorage.setItem('lotteryTickets', JSON.stringify(tickets));
            }
            
            // Update statistics display
            function updateStats() {
                totalTicketsEl.textContent = stats.totalTickets;
                totalWinsEl.textContent = stats.totalWins;
                totalWinningsEl.textContent = stats.totalWinnings;
                
                if (stats.totalTickets > 0) {
                    const winRate = Math.round((stats.totalWins / stats.totalTickets) * 100);
                    winRateEl.textContent = `${winRate}%`;
                } else {
                    winRateEl.textContent = '0%';
                }
            }
            
            // Render all tickets
            function renderTickets() {
                if (tickets.length === 0) {
                    noTicketsMessage.style.display = 'block';
                    ticketGrid.innerHTML = '<p id="noTicketsMessage">You don\'t have any tickets yet. Buy one to get started!</p>';
                    return;
                }
                
                noTicketsMessage.style.display = 'none';
                ticketGrid.innerHTML = '';
                
                // Sort tickets by unscratched first, then by tier
                const sortedTickets = [...tickets].sort((a, b) => {
                    if (a.scratched === b.scratched) {
                        // Sort by tier if both are same scratched status
                        const tierOrder = ['diamond', 'platinum', 'gold', 'silver', 'weekly', 'jackpot'];
                        return tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
                    }
                    return a.scratched ? 1 : -1;
                });
                
                sortedTickets.forEach((ticket, index) => {
                    const ticketEl = document.createElement('div');
                    ticketEl.className = `ticket-item ${ticket.scratched ? 'scratched' : ''} ${ticket.isWinner ? 'winner' : ''}`;
                    
                    // Format tier name
                    let tierName = ticket.tier.charAt(0).toUpperCase() + ticket.tier.slice(1);
                    if (ticket.tier === 'weekly') tierName = 'Weekly Entry';
                    if (ticket.tier === 'jackpot') tierName = 'Jackpot Entry';
                    
                    // Format date
                    const date = new Date(ticket.timestamp);
                    const formattedDate = date.toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    let prizeText = '';
                    if (ticket.scratched) {
                        prizeText = ticket.isWinner ? 
                            `<div class="scratch-result win">You won ₹${ticket.prize}!</div>` : 
                            `<div class="scratch-result lose">Try again!</div>`;
                    }
                    
                    ticketEl.innerHTML = `
                        <div class="ticket-tier">${tierName}</div>
                        <div class="ticket-id">${ticket.id}</div>
                        
                        <div class="scratch-area" data-index="${index}">
                            ${!ticket.scratched ? 
                                '<div class="scratch-cover">Scratch to reveal</div>' : 
                                ''}
                            ${prizeText}
                        </div>
                        
                        <div class="ticket-actions">
                            ${!ticket.scratched ? 
                                `<button class="btn btn-outline btn-small scratch-btn" data-index="${index}">Scratch Now</button>` : 
                                ''}
                            ${ticket.isWinner ? 
                                `<span class="badge badge-success">Winner</span>` : 
                                ticket.scratched ? `<span class="badge badge-danger">Scratched</span>` : ''}
                        </div>
                        
                        <div class="ticket-date">${formattedDate}</div>
                    `;
                    
                    ticketGrid.appendChild(ticketEl);
                    
                    // Add scratch canvas for unscratched tickets
                    if (!ticket.scratched) {
                        const scratchArea = ticketEl.querySelector('.scratch-area');
                        setupScratchCanvas(scratchArea, index);
                    }
                });
                
                // Add scratch event listeners for buttons
                document.querySelectorAll('.scratch-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const index = parseInt(this.getAttribute('data-index'));
                        scratchTicket(index);
                    });
                });
            }
            
            // Setup scratch canvas for a ticket
            function setupScratchCanvas(scratchArea, index) {
                const canvas = document.createElement('canvas');
                canvas.className = 'scratch-canvas';
                scratchArea.appendChild(canvas);
                
                // Set canvas dimensions
                const rect = scratchArea.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                
                const ctx = canvas.getContext('2d');
                
                // Initial setup
                ctx.fillStyle = '#9d50bb';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = 'destination-out';
                
                let isDrawing = false;
                let lastX = 0;
                let lastY = 0;
                
                // Mouse events
                canvas.addEventListener('mousedown', (e) => {
                    isDrawing = true;
                    lastX = e.offsetX;
                    lastY = e.offsetY;
                });
                
                canvas.addEventListener('mousemove', (e) => {
                    if (!isDrawing) return;
                    
                    ctx.beginPath();
                    ctx.moveTo(lastX, lastY);
                    ctx.lineTo(e.offsetX, e.offsetY);
                    ctx.lineWidth = 20;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                    
                    lastX = e.offsetX;
                    lastY = e.offsetY;
                    
                    // Check if enough has been scratched
                    checkScratchCompletion(canvas, index);
                });
                
                canvas.addEventListener('mouseup', () => {
                    isDrawing = false;
                    checkScratchCompletion(canvas, index);
                });
                
                canvas.addEventListener('mouseleave', () => {
                    isDrawing = false;
                    checkScratchCompletion(canvas, index);
                });
                
                // Touch events for mobile
                canvas.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    isDrawing = true;
                    const touch = e.touches[0];
                    const rect = canvas.getBoundingClientRect();
                    lastX = touch.clientX - rect.left;
                    lastY = touch.clientY - rect.top;
                });
                
                canvas.addEventListener('touchmove', (e) => {
                    if (!isDrawing) return;
                    e.preventDefault();
                    
                    const touch = e.touches[0];
                    const rect = canvas.getBoundingClientRect();
                    const x = touch.clientX - rect.left;
                    const y = touch.clientY - rect.top;
                    
                    ctx.beginPath();
                    ctx.moveTo(lastX, lastY);
                    ctx.lineTo(x, y);
                    ctx.lineWidth = 20;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                    
                    lastX = x;
                    lastY = y;
                    
                    checkScratchCompletion(canvas, index);
                });
                
                canvas.addEventListener('touchend', () => {
                    isDrawing = false;
                    checkScratchCompletion(canvas, index);
                });
            }
            
            // Check if enough of the scratch card has been revealed
            function checkScratchCompletion(canvas, index) {
                // Get the pixel data from the canvas
                const ctx = canvas.getContext('2d');
                const pixelBuffer = new Uint32Array(
                    ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
                );
                
                // Count how many pixels have been cleared
                let clearedPixels = 0;
                for (let i = 0; i < pixelBuffer.length; i++) {
                    if (pixelBuffer[i] === 0) clearedPixels++;
                }
                
                // If more than 30% is cleared, consider it scratched
                const scratchRatio = clearedPixels / pixelBuffer.length;
                if (scratchRatio > 0.3) {
                    scratchTicket(index);
                }
            }
            
            // Scratch a ticket to reveal the result
            function scratchTicket(index, silent = false) {
                // Determine if this is a winning ticket based on tier
                const ticket = tickets[index];
                
                // If already scratched, do nothing
                if (ticket.scratched) return;
                
                let isWinner = false;
                let prize = 0;
                
                // Set win probabilities and prize amounts based on tier
                if (ticket.tier === 'silver') {
                    isWinner = Math.random() < 0.1; // 10% chance
                    prize = isWinner ? getRandomPrize(10, 500) : 0;
                } else if (ticket.tier === 'gold') {
                    isWinner = Math.random() < 0.01; // 20% chance
                    prize = isWinner ? getRandomPrize(50, 2000) : 0;
                } else if (ticket.tier === 'platinum') {
                    isWinner = Math.random() < 0.01; // 30% chance
                    prize = isWinner ? getRandomPrize(100, 5000) : 0;
                } else if (ticket.tier === 'diamond') {
                    isWinner = Math.random() < 0.01; // 40% chance
                    prize = isWinner ? getRandomPrize(500, 2500) : 0;
                } else if (ticket.tier === 'weekly') {
                    // Weekly lottery - only winners are shown (actual draw happens later)
                    isWinner = Math.random() < 0.01; // 15% chance for demo
                    prize = isWinner ? getRandomPrize(100, 1000) : 0;
                } else if (ticket.tier === 'jackpot') {
                    // Jackpot - only winners are shown (actual draw happens later)
                    isWinner = Math.random() < 0.01; // 5% chance for demo
                    prize = isWinner ? getRandomPrize(5000, 10000) : 0;
                }
                
                // Update ticket
                tickets[index] = {
                    ...ticket,
                    scratched: true,
                    isWinner,
                    prize
                };
                
                // Update stats if winner
                if (isWinner) {
                    stats.totalWins += 1;
                    stats.totalWinnings += prize;
                }
                
                // If this was a gold/platinum/diamond ticket and lost, add consolation ticket
                if (!isWinner) {
                    if (ticket.tier === 'gold') {
                        addConsolationTicket('silver');
                    } else if (ticket.tier === 'platinum') {
                        addConsolationTicket('gold');
                    } else if (ticket.tier === 'diamond') {
                        addConsolationTicket('platinum');
                    }
                }
                
                saveData();
                renderTickets();
                updateStats();
                
                if (!silent) {
                    if (isWinner) {
                        // Show winning modal for significant prizes
                        if (prize >= 1000) {
                            winAmountEl.textContent = prize.toLocaleString('en-IN');
                            winningModal.style.display = 'flex';
                            document.body.style.overflow = 'hidden';
                        } else {
                            showNotification(`You won ₹${prize}!`, 'success');
                        }
                    } else {
                        showNotification('Better luck next time!', 'info');
                    }
                }
            }
            
            // Get a random prize amount within a range
            function getRandomPrize(min, max) {
                // Round to nearest 10 for smaller amounts, 100 for larger
                const roundTo = max > 1000 ? 100 : 10;
                const random = Math.floor(Math.random() * (max - min + 1)) + min;
                return Math.round(random / roundTo) * roundTo;
            }
            
            // Add consolation ticket
            function addConsolationTicket(tier) {
                tickets.push({
                    id: generateTicketId(),
                    tier,
                    scratched: false,
                    isWinner: false,
                    prize: 0,
                    timestamp: new Date().toISOString()
                });
                saveData();
                
                if (tickets.length === 1) {
                    // If this was the first ticket, re-render
                    renderTickets();
                }
                
                showNotification(`You received a free ${tier} ticket!`, 'info');
            }
            
            // Show notification
            function showNotification(message, type = 'success') {
                notificationText.textContent = message;
                notification.className = `notification ${type}`;
                notification.classList.add('show');
                
                setTimeout(() => {
                    notification.classList.remove('show');
                }, 5000);
            }
        });