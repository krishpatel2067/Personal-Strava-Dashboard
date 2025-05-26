from flask import Flask

app = Flask(__name__)

@app.route('/api/python', methods=['GET'])
def test():
    return 'Hello from the other side!'

if __name__ == '__main__':
    app.run(port=5000, debug=True)