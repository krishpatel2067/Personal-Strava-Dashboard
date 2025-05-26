from flask import Flask
import json
from analysis import analyze_and_store 

app = Flask(__name__)

@app.route('/api/python', methods=['GET'])
def get_analysis():
    analyze_and_store('analysis.json')

    with open('analysis.json', 'r') as file:
        analysis = json.load(file)
        return analysis

if __name__ == '__main__':
    app.run(port=5000, debug=True)