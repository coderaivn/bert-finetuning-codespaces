import os
import logging
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, session, Response
from flask_cors import CORS
from reddit_sentiment import RedditSentimentAnalyzer

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_dev_key")
CORS(app)

# Initialize Reddit sentiment analyzer
reddit_analyzer = RedditSentimentAnalyzer()

# Add current time to all templates
@app.context_processor
def inject_now():
    return {'now': datetime.now()}

@app.route('/')
def index():
    """Render the main page of the application."""
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    """Process the form submission and perform sentiment analysis."""
    try:
        # Get form data
        subreddit = request.form.get('subreddit', '').strip()
        search_term = request.form.get('search_term', '').strip()
        post_limit = int(request.form.get('post_limit', 10))
        time_filter = request.form.get('time_filter', 'week')
        
        # Validate inputs
        if not subreddit:
            flash('Please enter a subreddit name', 'error')
            return redirect(url_for('index'))
        
        # Perform analysis
        app.logger.debug(f"Analyzing subreddit: {subreddit}, search: {search_term}, limit: {post_limit}")
        
        # Get data and perform sentiment analysis
        results = reddit_analyzer.analyze_subreddit(
            subreddit=subreddit,
            search_term=search_term,
            limit=post_limit,
            time_filter=time_filter
        )
        
        # Save results in session for display
        session['analysis_results'] = results
        
        return redirect(url_for('results'))
    
    except Exception as e:
        app.logger.error(f"Error in analysis: {str(e)}")
        flash(f"An error occurred: {str(e)}", 'error')
        return redirect(url_for('index'))

@app.route('/results')
def results():
    """Display the results of the sentiment analysis."""
    # Get results from session
    results = session.get('analysis_results')
    
    if not results:
        flash('No analysis results found. Please perform an analysis first.', 'error')
        return redirect(url_for('index'))
    
    # Prepare data for charts
    compounds = []
    titles = []
    
    if 'posts' in results and results['posts']:
        for post in results['posts']:
            if 'sentiment' in post and 'compound' in post['sentiment']:
                compounds.append(post['sentiment']['compound'])
                titles.append(post['title'])
    
    # Add to results dictionary with defaults for empty arrays
    results['compounds'] = compounds or []
    results['titles'] = titles or []
    
    # Log the structure for debugging
    app.logger.debug(f"Chart data prepared: {len(compounds)} compounds, {len(titles)} titles")
    
    return render_template('results.html', results=results)

@app.route('/export')
def export():
    """Export the analysis results as CSV."""
    results = session.get('analysis_results')
    
    if not results:
        flash('No analysis results found. Please perform an analysis first.', 'error')
        return redirect(url_for('index'))
    
    # Generate CSV content
    csv_content = reddit_analyzer.export_to_csv(results)
    
    # Send response with CSV file
    response = Response(
        csv_content,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=reddit_sentiment_analysis.csv"}
    )
    
    return response

@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors."""
    return render_template('index.html', error="Page not found"), 404

@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors."""
    app.logger.error(f"Server error: {str(e)}")
    return render_template('index.html', error="An internal server error occurred"), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
