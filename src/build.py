import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sh=open('shell.html').read();d=open('dados.js').read();a=open('app.js').read()
open('../index.html','w').write(sh.replace('/*DADOS*/',d).replace('/*APP*/',a))
print('index.html gerado')
