// Medieval Tarot Reddit Sentiment Analysis - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize core components
    initializeForm();
    initializeLoadingOverlay();
    initializeCharts();
    
    // Check for flash messages and handle them
    handleFlashMessages();
    
    // Initialize interactive tarot features
    animateCards();
    initializeCardSpreads();
    generateTarotFortune();
    
    // Add event handlers for interactive elements
    initializeInteractiveElements();
});

// Form handling
function initializeForm() {
    const analysisForm = document.getElementById('analysis-form');
    
    if (analysisForm) {
        analysisForm.addEventListener('submit', function(e) {
            // Show loading overlay
            document.getElementById('loading-overlay').style.display = 'flex';
            
            // Let the form submit normally to the server
            return true;
        });
    }
}

// Loading overlay
function initializeLoadingOverlay() {
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Hide loading overlay if it exists and is visible
    if (loadingOverlay && window.location.pathname !== '/analyze') {
        loadingOverlay.style.display = 'none';
    }
}

// Flash messages handling
function handleFlashMessages() {
    // Auto-hide flash messages after 5 seconds
    setTimeout(function() {
        const flashMessages = document.querySelectorAll('.alert');
        flashMessages.forEach(function(message) {
            message.style.opacity = '0';
            setTimeout(function() {
                message.style.display = 'none';
            }, 500);
        });
    }, 5000);
}

// Initialize chart visualizations
function initializeCharts() {
    // Check if we're on the results page and the sentiment distribution chart should be rendered
    const distributionChartCanvas = document.getElementById('sentiment-distribution-chart');
    if (distributionChartCanvas) {
        renderSentimentDistributionChart(distributionChartCanvas);
    }
    
    // Check if compound value chart exists
    const compoundChartCanvas = document.getElementById('sentiment-compound-chart');
    if (compoundChartCanvas) {
        renderSentimentCompoundChart(compoundChartCanvas);
    }
}

// Render sentiment distribution chart
function renderSentimentDistributionChart(canvas) {
    // Get the data from the data attributes
    const positive = parseFloat(canvas.getAttribute('data-positive') || 0);
    const neutral = parseFloat(canvas.getAttribute('data-neutral') || 0);
    const negative = parseFloat(canvas.getAttribute('data-negative') || 0);
    
    const ctx = canvas.getContext('2d');
    
    // Define custom color scheme to match the medieval tarot theme
    const chartColors = {
        positive: '#5d9e7e',  // Green for positive
        neutral: '#8a7f66',   // Neutral brown
        negative: '#9e5d5d',  // Red for negative
        textColor: '#e0e0e0', // Light text
        borderColor: '#c6a859' // Gold
    };
    
    // Create the chart
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                data: [positive, neutral, negative],
                backgroundColor: [
                    chartColors.positive,
                    chartColors.neutral,
                    chartColors.negative
                ],
                borderColor: chartColors.borderColor,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                position: 'bottom',
                labels: {
                    fontFamily: "'Lora', serif",
                    fontSize: 14,
                    fontColor: chartColors.textColor,
                    padding: 20
                }
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        const dataset = data.datasets[tooltipItem.datasetIndex];
                        const value = dataset.data[tooltipItem.index];
                        const label = data.labels[tooltipItem.index];
                        return `${label}: ${value}%`;
                    }
                },
                titleFontFamily: "'IM Fell English', serif",
                bodyFontFamily: "'Lora', serif",
                backgroundColor: 'rgba(26, 26, 26, 0.9)',
                borderColor: chartColors.borderColor,
                borderWidth: 1
            },
            plugins: {
                datalabels: {
                    color: chartColors.textColor,
                    font: {
                        family: "'Lora', serif",
                        size: 14
                    },
                    formatter: function(value) {
                        if (value < 5) return '';
                        return value + '%';
                    }
                }
            }
        }
    });
}

// Render sentiment compound values chart (for posts)
function renderSentimentCompoundChart(canvas) {
    // Get the data from the data attributes
    const dataString = canvas.getAttribute('data-compounds');
    const labelsString = canvas.getAttribute('data-titles');
    
    if (!dataString || !labelsString) {
        console.error('Missing data attributes for chart');
        return;
    }
    
    // Parse the JSON string data
    let compounds = [];
    let titles = [];
    
    try {
        compounds = JSON.parse(dataString);
        titles = JSON.parse(labelsString);
        
        // Check if the data is valid
        if (!Array.isArray(compounds) || !Array.isArray(titles)) {
            console.error('Invalid data format for chart');
            return;
        }
        
        // Truncate long titles for better display
        titles = titles.map(title => {
            if (title && title.length > 30) {
                return title.substring(0, 27) + '...';
            }
            return title || '';
        });
    } catch (error) {
        console.error('Error parsing JSON data for chart:', error);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Define colors
    const chartColors = {
        positive: 'rgba(93, 158, 126, 0.7)',  // Green with transparency
        neutral: 'rgba(138, 127, 102, 0.7)',  // Neutral brown with transparency
        negative: 'rgba(158, 93, 93, 0.7)',   // Red with transparency
        textColor: '#e0e0e0',                 // Light text
        gridColor: 'rgba(198, 168, 89, 0.2)'  // Gold with high transparency
    };
    
    // Determine colors based on sentiment value
    const backgroundColors = compounds.map(value => {
        if (value >= 0.05) return chartColors.positive;
        if (value <= -0.05) return chartColors.negative;
        return chartColors.neutral;
    });
    
    // Create the chart
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: titles,
            datasets: [{
                label: 'Sentiment Compound',
                data: compounds,
                backgroundColor: backgroundColors,
                borderColor: '#c6a859',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    gridLines: {
                        color: chartColors.gridColor,
                        zeroLineColor: '#c6a859'
                    },
                    ticks: {
                        fontColor: chartColors.textColor,
                        fontFamily: "'Lora', serif",
                        callback: function(value) {
                            return value.toFixed(1);
                        },
                        min: -1,
                        max: 1
                    }
                }],
                xAxes: [{
                    gridLines: {
                        color: chartColors.gridColor
                    },
                    ticks: {
                        fontColor: chartColors.textColor,
                        fontFamily: "'Lora', serif",
                        maxRotation: 45,
                        minRotation: 45
                    }
                }]
            },
            tooltips: {
                callbacks: {
                    title: function(tooltipItems, data) {
                        return data.labels[tooltipItems[0].index];
                    },
                    label: function(tooltipItem, data) {
                        const value = tooltipItem.yLabel;
                        let sentiment = 'Neutral';
                        if (value >= 0.05) sentiment = 'Positive';
                        if (value <= -0.05) sentiment = 'Negative';
                        return [
                            `Compound: ${value.toFixed(3)}`,
                            `Sentiment: ${sentiment}`
                        ];
                    }
                },
                titleFontFamily: "'IM Fell English', serif",
                bodyFontFamily: "'Lora', serif",
                backgroundColor: 'rgba(26, 26, 26, 0.9)',
                borderColor: '#c6a859',
                borderWidth: 1
            }
        }
    });
}

// Function to flip a tarot card with enhanced animation
function flipCard(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
        // Remove any previously selected cards
        document.querySelectorAll('.tarot-card.selected').forEach(otherCard => {
            if (otherCard.id !== cardId) {
                otherCard.classList.remove('selected');
            }
        });
        
        // Toggle flipped state
        card.classList.toggle('flipped');
        
        // Add special effects when flipping
        if (card.classList.contains('flipped')) {
            // Play flip sound (if enabled)
            playCardSound('flip');
            
            // Add a selected state
            card.classList.add('selected');
            
            // Scroll to ensure the card is visible
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // Play another sound for flipping back
            playCardSound('flipBack');
            card.classList.remove('selected');
        }
    }
}

// Card sound effects
function playCardSound(soundType) {
    // Check if user has enabled sound (future feature)
    const soundEnabled = localStorage.getItem('tarotSoundEnabled') !== 'false';
    
    if (soundEnabled) {
        // Different sound effect for each action
        let soundDescription = '';
        
        switch(soundType) {
            case 'flip':
                soundDescription = 'card flipping sound - soft whoosh';
                break;
            case 'flipBack':
                soundDescription = 'card returning sound - soft slide';
                break;
            case 'shuffle':
                soundDescription = 'card shuffling - gentle rustling';
                break;
            case 'spread':
                soundDescription = 'cards spreading out - soft placement';
                break;
            default:
                soundDescription = 'generic card sound';
        }
        
        // Log the sound description for now (future implementation will use actual sounds)
        console.log(`Playing ${soundDescription}`);
        
        // Future implementation for actual sound effects:
        // const audio = new Audio(`/static/sounds/${soundType}.mp3`);
        // audio.volume = 0.5;
        // audio.play();
    }
}

// Animate cards when they come into view
function animateCards() {
    const tarotCards = document.querySelectorAll('.tarot-card');
    
    // If we have cards, set up animation
    if (tarotCards.length > 0) {
        // First, ensure all cards start hidden
        tarotCards.forEach(card => {
            card.style.opacity = "0";
            card.style.transform = "translateY(30px)";
        });
        
        // Then create an observer to animate them as they come into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add animated class with a staggered delay
                    setTimeout(() => {
                        entry.target.classList.add('animated');
                    }, 100 * Array.from(tarotCards).indexOf(entry.target));
                    
                    // Unobserve after animation
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        // Observe each card
        tarotCards.forEach(card => {
            observer.observe(card);
        });
    }
}

// Initialize card spreading animations with shuffling effect
function initializeCardSpreads() {
    const cardSpreads = document.querySelectorAll('.card-spread');
    
    cardSpreads.forEach(spread => {
        // Add class to initiate shuffling animation
        spread.classList.add('shuffling');
        
        // Get cards in this spread
        const cards = spread.querySelectorAll('.tarot-card');
        
        // Animate each card with a shuffling effect
        cards.forEach((card, index) => {
            // Apply random initial positions for shuffling
            const randomX = Math.floor(Math.random() * 40) - 20; // -20px to +20px
            const randomY = Math.floor(Math.random() * 40) - 20; // -20px to +20px
            const randomRotate = Math.floor(Math.random() * 40) - 20; // -20deg to +20deg
            
            card.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg)`;
            card.classList.add('shuffling');
            
            // Play shuffle sound
            setTimeout(() => {
                playCardSound('shuffle');
            }, 100 * index);
        });
        
        // After shuffling animation completes, arrange cards properly
        setTimeout(() => {
            // Remove shuffling classes
            spread.classList.remove('shuffling');
            cards.forEach(card => {
                card.classList.remove('shuffling');
                // Reset transform to let the CSS take over for final positioning
                card.style.transform = '';
            });
            
            // Add spread-complete class to initiate the spread animation
            spread.classList.add('spread-complete');
            
            // Play the spread sound
            playCardSound('spread');
        }, 1500); // Duration of shuffle animation before spreading
    });
    
    // Check if we have a main card for fortune telling
    const fortuneCard = document.getElementById('overall-card');
    if (fortuneCard) {
        // Apply fortune card animation after the shuffle and spread
        setTimeout(() => {
            fortuneCard.classList.add('fortune-card');
        }, 2000);
    }
}

// Generate tarot fortune readings based on sentiment data
function generateTarotFortune() {
    const fortuneCard = document.getElementById('overall-card');
    if (!fortuneCard) return;
    
    // Get sentiment value
    const sentimentValue = parseFloat(fortuneCard.querySelector('.tarot-card-value').textContent);
    
    // Get sentiment category
    let sentimentCategory = 'neutral';
    if (sentimentValue >= 0.05) sentimentCategory = 'positive';
    if (sentimentValue <= -0.05) sentimentCategory = 'negative';
    
    // Generate fortune text based on sentiment
    let fortuneText = '';
    
    if (sentimentCategory === 'positive') {
        const positiveMessages = [
            "The Lucky Charm reveals a community full of light and prosperity ahead",
            "The path of this community shines with golden opportunities",
            "Fortune smiles upon these discussions, bringing wisdom and joy",
            "The leprechaun's treasure pot overflows with positivity in this realm",
            "Prosperity and good fortune abound in this community's future"
        ];
        fortuneText = positiveMessages[Math.floor(Math.random() * positiveMessages.length)];
    } else if (sentimentCategory === 'negative') {
        const negativeMessages = [
            "The Empty Pot suggests challenges to overcome in this community",
            "Shadows gather around these discussions, but light always follows darkness",
            "The way forward requires caution and patience through troubled waters",
            "This community faces tests of character that will ultimately strengthen it",
            "A time of reflection is needed to find the rainbow beyond these clouds"
        ];
        fortuneText = negativeMessages[Math.floor(Math.random() * negativeMessages.length)];
    } else {
        const neutralMessages = [
            "The Rainbow's End reveals a balanced path ahead for this community",
            "Neither stormy nor clear, the community stands at a crossroads of possibility",
            "The scales find equilibrium in these discussions, showing balanced perspectives",
            "This gathering shows the duality of all things, with potential for growth",
            "Between light and shadow, this community walks the middle path of wisdom"
        ];
        fortuneText = neutralMessages[Math.floor(Math.random() * neutralMessages.length)];
    }
    
    // Add fortune text to the page if fortune-text element exists
    const fortuneElement = document.getElementById('fortune-text');
    if (fortuneElement) {
        fortuneElement.textContent = fortuneText;
        fortuneElement.classList.add('fortune-reveal');
    }
}

// Enhanced function to export analysis results
function exportResults() {
    // Add visual feedback when exporting
    const exportBtn = document.querySelector('.btn-export');
    if (exportBtn) {
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Preparing Fortune...';
        exportBtn.disabled = true;
        
        // Simulate processing
        setTimeout(() => {
            window.location.href = '/export';
        }, 800);
    } else {
        window.location.href = '/export';
    }
}

// Initialize interactive elements and event handlers
function initializeInteractiveElements() {
    // Fix JS error in animateCards function
    const tarotCards = document.querySelectorAll('.tarot-card');
    if (tarotCards.length > 0) {
        // First, ensure all cards have opacity and transform set
        tarotCards.forEach((card, index) => {
            card.style.opacity = "0";
            card.style.transform = "translateY(30px)";
            
            // Animate with staggered delay
            setTimeout(() => {
                card.style.opacity = "1";
                card.style.transform = "translateY(0)";
                card.classList.add('animated');
            }, 100 + (index * 150)); // Staggered animation
        });
    }
    
    // Add fortune text display area if it doesn't exist
    const resultsSection = document.querySelector('.results-section');
    if (resultsSection && !document.getElementById('fortune-text')) {
        const fortuneCard = document.getElementById('overall-card');
        if (fortuneCard) {
            // Create fortune text element
            const fortuneContainer = document.createElement('div');
            fortuneContainer.className = 'fortune-container mt-4 mb-5 text-center';
            
            const fortuneText = document.createElement('p');
            fortuneText.id = 'fortune-text';
            fortuneText.className = 'fortune-text';
            fortuneText.style.fontFamily = "var(--font-medieval)";
            fortuneText.style.color = "var(--accent-gold)";
            fortuneText.style.fontSize = "1.3rem";
            fortuneText.style.fontStyle = "italic";
            fortuneText.style.opacity = "0";
            fortuneText.style.transform = "translateY(20px)";
            fortuneText.style.transition = "all 1s ease-out";
            
            fortuneContainer.appendChild(fortuneText);
            
            // Insert after the main card
            const mainCardContainer = fortuneCard.closest('.row');
            mainCardContainer.after(fortuneContainer);
            
            // Generate the fortune
            setTimeout(generateTarotFortune, 1500);
            
            // Reveal the text with animation
            setTimeout(() => {
                fortuneText.style.opacity = "1";
                fortuneText.style.transform = "translateY(0)";
            }, 2000);
        }
    }
    
    // Make cards in grid draggable for a more interactive experience
    // This is a placeholder for future drag-and-drop functionality
    const cardGrid = document.querySelector('.tarot-card-grid');
    if (cardGrid) {
        cardGrid.classList.add('card-spread');
        
        // If there are 3 or fewer cards, use special spread animation
        const cardCount = cardGrid.querySelectorAll('.tarot-card').length;
        if (cardCount <= 3 && cardCount > 0) {
            cardGrid.classList.add('three-card-spread');
        }
        
        // Apply the shuffling animation first
        cardGrid.classList.add('shuffling');
        
        // Get all cards in the grid
        const gridCards = cardGrid.querySelectorAll('.tarot-card');
        
        // Apply random positions for shuffling
        gridCards.forEach((card, index) => {
            // Create random shuffle positions
            const randomX = Math.floor(Math.random() * 40) - 20;
            const randomY = Math.floor(Math.random() * 40) - 20;
            const randomRotate = Math.floor(Math.random() * 40) - 20;
            
            // Set CSS variables for the animation
            card.style.setProperty('--x', `${randomX}px`);
            card.style.setProperty('--y', `${randomY}px`);
            card.style.setProperty('--rotate', `${randomRotate}deg`);
            card.style.setProperty('--random-rotate', `${randomRotate}deg`);
            
            // Add shuffling class
            card.classList.add('shuffling');
            
            // Play shuffle sound for each card with staggered timing
            setTimeout(() => {
                playCardSound('shuffle');
            }, 100 * index);
        });
        
        // After shuffle completes, remove shuffle classes and apply normal spread
        setTimeout(() => {
            // Remove shuffling classes
            cardGrid.classList.remove('shuffling');
            gridCards.forEach(card => {
                card.classList.remove('shuffling');
            });
            
            // Add spread-complete class for the final positioning
            cardGrid.classList.add('spread-complete');
            
            // Play spreading sound
            playCardSound('spread');
        }, 1500);
    }
}
