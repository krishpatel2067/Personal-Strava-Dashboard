dic = {'key1': 1, 'key2': 2, 'key3': 3}
print(dic)

def delete(dic):
    del dic['key1']
    return dic
dic = delete(dic)
print(dic)