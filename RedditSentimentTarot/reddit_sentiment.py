import praw
import os
import pandas as pd
import logging
import re
import io
from datetime import datetime
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from textblob import TextBlob
import nltk

# Download necessary NLTK data
nltk.download('vader_lexicon', quiet=True)

class RedditSentimentAnalyzer:
    """Class to handle Reddit API interaction and sentiment analysis."""
    
    def __init__(self):
        """Initialize the Reddit API client and sentiment analyzers."""
        # Set up logging
        logging.basicConfig(level=logging.DEBUG)
        self.logger = logging.getLogger(__name__)
        
        # Initialize Reddit API client
        self.reddit = praw.Reddit(
            client_id=os.environ.get('REDDIT_CLIENT_ID', 'YourClientID'),
            client_secret=os.environ.get('REDDIT_CLIENT_SECRET', 'YourClientSecret'),
            user_agent=os.environ.get('REDDIT_USER_AGENT', 'TarotSentiment/1.0 by YourUsername')
        )
        
        # Initialize sentiment analyzers
        self.vader = SentimentIntensityAnalyzer()
    
    def clean_text(self, text):
        """Clean and normalize text for sentiment analysis."""
        if not text:
            return ""
        
        # Convert to string if not already
        text = str(text)
        
        # Remove URLs
        text = re.sub(r'http\S+', '', text)
        
        # Remove special characters and numbers
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Convert to lowercase and strip whitespace
        text = text.lower().strip()
        
        return text
    
    def get_sentiment(self, text):
        """Analyze sentiment of text using multiple methods and return combined results."""
        if not text:
            return {
                'compound': 0,
                'pos': 0,
                'neu': 0,
                'neg': 0,
                'polarity': 0,
                'subjectivity': 0,
                'sentiment_category': 'neutral'
            }
        
        # VADER sentiment analysis
        vader_scores = self.vader.polarity_scores(text)
        
        # TextBlob sentiment analysis
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity
        
        # Determine overall sentiment category
        compound = vader_scores['compound']
        if compound >= 0.05:
            sentiment_category = 'positive'
        elif compound <= -0.05:
            sentiment_category = 'negative'
        else:
            sentiment_category = 'neutral'
        
        # Return combined results
        return {
            'compound': round(compound, 3),
            'pos': round(vader_scores['pos'], 3),
            'neu': round(vader_scores['neu'], 3),
            'neg': round(vader_scores['neg'], 3),
            'polarity': round(polarity, 3),
            'subjectivity': round(subjectivity, 3),
            'sentiment_category': sentiment_category
        }
    
    def analyze_subreddit(self, subreddit, search_term=None, limit=10, time_filter='week'):
        """
        Fetch posts from a subreddit, analyze sentiment, and return results.
        
        Args:
            subreddit (str): Name of the subreddit to analyze
            search_term (str, optional): Term to search for within the subreddit
            limit (int, optional): Maximum number of posts to analyze
            time_filter (str, optional): Time filter for posts ('day', 'week', 'month', 'year', 'all')
            
        Returns:
            dict: Results of the analysis including posts data and overall statistics
        """
        self.logger.debug(f"Analyzing r/{subreddit} with search term: {search_term}")
        
        try:
            # Get subreddit instance
            subreddit_instance = self.reddit.subreddit(subreddit)
            
            # Fetch posts based on parameters
            if search_term:
                posts = list(subreddit_instance.search(search_term, time_filter=time_filter, limit=limit))
            else:
                posts = list(subreddit_instance.top(time_filter=time_filter, limit=limit))
            
            if not posts:
                self.logger.warning(f"No posts found in r/{subreddit} with the given criteria")
                return {
                    'subreddit': subreddit,
                    'search_term': search_term,
                    'post_count': 0,
                    'posts': [],
                    'overall_sentiment': {'compound': 0, 'pos': 0, 'neu': 0, 'neg': 0, 'sentiment_category': 'neutral'},
                    'sentiment_distribution': {'positive': 0, 'neutral': 0, 'negative': 0},
                    'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
            
            # Process each post
            processed_posts = []
            overall_compound = 0
            overall_pos = 0
            overall_neu = 0
            overall_neg = 0
            sentiment_counts = {'positive': 0, 'neutral': 0, 'negative': 0}
            
            for post in posts:
                # Clean and analyze post title
                title_clean = self.clean_text(post.title)
                title_sentiment = self.get_sentiment(title_clean)
                
                # Clean and analyze post text (selftext)
                selftext_clean = self.clean_text(post.selftext)
                selftext_sentiment = self.get_sentiment(selftext_clean)
                
                # Combine title and selftext sentiment (weighted average)
                # Give more weight to title if selftext is empty
                if not selftext_clean:
                    combined_sentiment = title_sentiment
                else:
                    combined_sentiment = {
                        'compound': (title_sentiment['compound'] * 0.6 + selftext_sentiment['compound'] * 0.4),
                        'pos': (title_sentiment['pos'] * 0.6 + selftext_sentiment['pos'] * 0.4),
                        'neu': (title_sentiment['neu'] * 0.6 + selftext_sentiment['neu'] * 0.4),
                        'neg': (title_sentiment['neg'] * 0.6 + selftext_sentiment['neg'] * 0.4),
                        'polarity': (title_sentiment['polarity'] * 0.6 + selftext_sentiment['polarity'] * 0.4),
                        'subjectivity': (title_sentiment['subjectivity'] * 0.6 + selftext_sentiment['subjectivity'] * 0.4)
                    }
                    
                    # Determine sentiment category based on compound score
                    if combined_sentiment['compound'] >= 0.05:
                        combined_sentiment['sentiment_category'] = 'positive'
                    elif combined_sentiment['compound'] <= -0.05:
                        combined_sentiment['sentiment_category'] = 'negative'
                    else:
                        combined_sentiment['sentiment_category'] = 'neutral'
                
                # Round values for display
                for key in ['compound', 'pos', 'neu', 'neg', 'polarity', 'subjectivity']:
                    combined_sentiment[key] = round(combined_sentiment[key], 3)
                
                # Update overall sentiment tracking
                overall_compound += combined_sentiment['compound']
                overall_pos += combined_sentiment['pos']
                overall_neu += combined_sentiment['neu']
                overall_neg += combined_sentiment['neg']
                sentiment_counts[combined_sentiment['sentiment_category']] += 1
                
                # Add processed post to results
                processed_posts.append({
                    'id': post.id,
                    'title': post.title,
                    'created_utc': datetime.fromtimestamp(post.created_utc).strftime('%Y-%m-%d %H:%M:%S'),
                    'score': post.score,
                    'upvote_ratio': post.upvote_ratio,
                    'num_comments': post.num_comments,
                    'permalink': post.permalink,
                    'sentiment': combined_sentiment
                })
            
            # Calculate overall sentiment
            post_count = len(processed_posts)
            if post_count > 0:
                overall_sentiment = {
                    'compound': round(overall_compound / post_count, 3),
                    'pos': round(overall_pos / post_count, 3),
                    'neu': round(overall_neu / post_count, 3),
                    'neg': round(overall_neg / post_count, 3)
                }
                
                # Determine overall sentiment category
                if overall_sentiment['compound'] >= 0.05:
                    overall_sentiment['sentiment_category'] = 'positive'
                elif overall_sentiment['compound'] <= -0.05:
                    overall_sentiment['sentiment_category'] = 'negative'
                else:
                    overall_sentiment['sentiment_category'] = 'neutral'
            else:
                overall_sentiment = {
                    'compound': 0,
                    'pos': 0,
                    'neu': 0,
                    'neg': 0,
                    'sentiment_category': 'neutral'
                }
            
            # Calculate sentiment distribution percentages
            sentiment_distribution = {
                'positive': round((sentiment_counts['positive'] / post_count) * 100 if post_count > 0 else 0, 1),
                'neutral': round((sentiment_counts['neutral'] / post_count) * 100 if post_count > 0 else 0, 1),
                'negative': round((sentiment_counts['negative'] / post_count) * 100 if post_count > 0 else 0, 1)
            }
            
            # Return complete analysis results
            return {
                'subreddit': subreddit,
                'search_term': search_term,
                'post_count': post_count,
                'posts': processed_posts,
                'overall_sentiment': overall_sentiment,
                'sentiment_distribution': sentiment_distribution,
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing subreddit: {str(e)}")
            raise Exception(f"Failed to analyze subreddit r/{subreddit}: {str(e)}")
    
    def export_to_csv(self, results):
        """Export analysis results to CSV format."""
        if not results or 'posts' not in results or not results['posts']:
            return "No data to export"
        
        # Create dataframe from posts data
        posts_data = []
        for post in results['posts']:
            posts_data.append({
                'Post ID': post['id'],
                'Title': post['title'],
                'Created UTC': post['created_utc'],
                'Score': post['score'],
                'Upvote Ratio': post['upvote_ratio'],
                'Comments': post['num_comments'],
                'Reddit URL': f"https://www.reddit.com{post['permalink']}",
                'Sentiment Compound': post['sentiment']['compound'],
                'Positive Score': post['sentiment']['pos'],
                'Neutral Score': post['sentiment']['neu'],
                'Negative Score': post['sentiment']['neg'],
                'Polarity': post['sentiment']['polarity'],
                'Subjectivity': post['sentiment']['subjectivity'],
                'Sentiment Category': post['sentiment']['sentiment_category']
            })
        
        df = pd.DataFrame(posts_data)
        
        # Add metadata at the top
        metadata = pd.DataFrame([
            {'Info': 'Subreddit', 'Value': results['subreddit']},
            {'Info': 'Search Term', 'Value': results['search_term'] or 'None'},
            {'Info': 'Post Count', 'Value': results['post_count']},
            {'Info': 'Analysis Time', 'Value': results['timestamp']},
            {'Info': 'Overall Sentiment', 'Value': results['overall_sentiment']['sentiment_category']},
            {'Info': 'Overall Compound Score', 'Value': results['overall_sentiment']['compound']},
            {'Info': 'Positive Posts %', 'Value': f"{results['sentiment_distribution']['positive']}%"},
            {'Info': 'Neutral Posts %', 'Value': f"{results['sentiment_distribution']['neutral']}%"},
            {'Info': 'Negative Posts %', 'Value': f"{results['sentiment_distribution']['negative']}%"}
        ])
        
        # Create in-memory string buffer
        csv_buffer = io.StringIO()
        
        # Write metadata
        metadata.to_csv(csv_buffer, index=False)
        csv_buffer.write("\n\n")  # Add space between metadata and posts data
        
        # Write posts data
        df.to_csv(csv_buffer, index=False)
        
        # Get the CSV string
        csv_content = csv_buffer.getvalue()
        
        return csv_content
