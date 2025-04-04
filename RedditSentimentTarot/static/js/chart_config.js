/**
 * Chart.js configuration and customization for the Reddit Tarot Sentiment Analysis application
 * This file provides custom styling and functionality for chart.js instances
 */

// Custom Chart.js defaults to match the medieval tarot theme
Chart.defaults.global.defaultFontFamily = "'Lora', serif";
Chart.defaults.global.defaultFontColor = '#e0e0e0';

// Custom plugin for adding ornate borders to charts
Chart.plugins.register({
    beforeDraw: function(chart) {
        const ctx = chart.ctx;
        const canvas = chart.canvas;
        
        // Only apply ornate border to pie and doughnut charts
        if (chart.config.type === 'pie' || chart.config.type === 'doughnut') {
            // Save the current context state
            ctx.save();
            
            // Draw a gold circular border
            const centerX = chart.width / 2;
            const centerY = chart.height / 2;
            const radius = Math.min(centerX, centerY) * 0.9;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#c6a859';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw decorative elements around the circle
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const x1 = centerX + Math.cos(angle) * radius;
                const y1 = centerY + Math.sin(angle) * radius;
                const x2 = centerX + Math.cos(angle) * (radius + 10);
                const y2 = centerY + Math.sin(angle) * (radius + 10);
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                
                // Add small circles at the end of each line
                ctx.beginPath();
                ctx.arc(x2, y2, 2, 0, 2 * Math.PI);
                ctx.fillStyle = '#c6a859';
                ctx.fill();
            }
            
            // Restore the context
            ctx.restore();
        }
    }
});

// Custom color palettes for sentiment analysis
const sentimentColors = {
    positive: {
        fill: 'rgba(48, 96, 175, 0.7)',  // Blue for high sentiment
        border: '#3060af'
    },
    neutral: {
        fill: 'rgba(255, 209, 102, 0.7)', // Yellow for neutral sentiment
        border: '#ffd166'
    },
    negative: {
        fill: 'rgba(195, 49, 73, 0.7)',  // Red for low sentiment
        border: '#c33149'
    },
    gold: {
        fill: 'rgba(198, 168, 89, 0.7)',
        border: '#c6a859'
    }
};

// Function to get appropriate color based on sentiment value
function getSentimentColor(value, alpha = 0.7) {
    if (value >= 0.05) {
        // Blue for positive/high sentiment
        return `rgba(48, 96, 175, ${alpha})`;
    } else if (value <= -0.05) {
        // Red for negative/low sentiment
        return `rgba(195, 49, 73, ${alpha})`;
    } else {
        // Yellow for neutral sentiment
        return `rgba(255, 209, 102, ${alpha})`;
    }
}

// Function to format tooltip text with medieval-style language
function formatTooltipText(label, value) {
    if (value >= 0.5) {
        return `${label}: Most favorable sentiment (${value})`;
    } else if (value >= 0.05) {
        return `${label}: Favorable sentiment (${value})`;
    } else if (value > -0.05 && value < 0.05) {
        return `${label}: Balanced sentiment (${value})`;
    } else if (value >= -0.5) {
        return `${label}: Unfavorable sentiment (${value})`;
    } else {
        return `${label}: Most unfavorable sentiment (${value})`;
    }
}

// Custom animations for chart elements
const chartAnimations = {
    tarotReveal: {
        duration: 1500,
        easing: 'easeOutCirc',
        delay: function(context) {
            return context.dataIndex * 100;
        }
    },
    mysticFade: {
        duration: 2000,
        easing: 'easeInOutQuart'
    }
};

// Apply these animations to Chart.js defaults
Chart.defaults.global.animation = chartAnimations.tarotReveal;
