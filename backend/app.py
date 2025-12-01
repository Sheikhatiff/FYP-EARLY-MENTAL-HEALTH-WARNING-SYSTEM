from flask import Flask, request, jsonify
from transformers import pipeline
import torch

app = Flask(__name__)

print("Loading BERT model...")
classifier = pipeline(
    'text-classification', 
    './checkpoint-3000', 
    device=0 if torch.cuda.is_available() else -1  
)
print("Model loaded successfully!")

@app.route('/classify', methods=['POST'])
def classify_text():
    try:
        data = request.json
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'Text is required'}), 400

        num_labels = len(classifier.model.config.id2label)

        results = classifier(text, top_k=num_labels)

        # Format predictions
        formatted_results = []
        for result in results:
            formatted_results.append({
                'label': result['label'],
                'score': result['score'],
                'confidence': f"{result['score'] * 100:.2f}%"
            })

        # Build `result` like get_top_predictions
        sorted_preds = sorted(results, key=lambda x: x['score'], reverse=True)
        result_var = [(p['label'], p['score']) for p in sorted_preds]
        result_dict = {p['label']: p['score'] for p in sorted_preds[:3]}

        
        return jsonify({
            'text': text,
            'predictions': formatted_results,
            'result_var': result_var ,
            'result_dict': result_dict
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)