export function getSentimentColor(sentiment: string): string {
    switch (sentiment.toLowerCase()) {
      case 'positive': return '#B0F0B9';
      case 'negative': return '#C34244';
      default: return '#F5BE6B';
    }
  }
  