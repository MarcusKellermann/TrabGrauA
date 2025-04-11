const DIVISOR = 8;
const BINARY_LENGTH = Math.ceil(Math.log2(DIVISOR));

// === GOLOMB ===
const Golomb = {
  encode(num, m = DIVISOR) {
    const q = Math.floor(num / m);
    const r = num % m;
    return "0".repeat(q) + "1" + r.toString(2).padStart(BINARY_LENGTH, "0");// sequência de zeros mais 1 separador e o resto da divisao em binario
  },

  decode(code, m = DIVISOR) {
    let i = 0, q = 0;
    while (code[i++] === "0") q++; // conta todos os 0s
    const r = parseInt(code.slice(i, i + BINARY_LENGTH), 2); //vai ler os proximos 3 bits e depois converter para numero inteiro
    return q * m + r; // retorna o numero inteiro
  },

  encodeText(text) {
    return [...text].map(c => this.encode(c.charCodeAt(0))).join("");
  },

  decodeText(encoded) {
    let i = 0, decoded = "";
    while (i < encoded.length) {
      let q = 0;
      while (encoded[i] === "0") { q++; i++; }// conta quantos 0s tem
      i++; 
      const r = parseInt(encoded.slice(i, i + BINARY_LENGTH), 2);// le os proximos 3 bits
      decoded += String.fromCharCode(q * DIVISOR + r);// relcalcula o codigo ASCII 
      i += BINARY_LENGTH;
    }
    return decoded;
  }
};

// === ELIAS-GAMMA ===
const EliasGamma = {
  encode(num) {
    if (num <= 0) throw new Error("Número deve ser maior que zero.");// Numero maior que 0 e positivo
    const binary = num.toString(2);// Converte o numero pra binario
    return "0".repeat(binary.length - 1) + binary;
  },

  decode(code) {
    let i = 0;
    while (code[i] === "0") i++;// Contas a quantidade de 0s antes do primeio 1
    const bits = code.slice(i, i + i + 1); // Pega os bits a partir do indice i
    return parseInt(bits, 2);//Converte os bits pra decimal
  },

  encodeText(text) {
    return [...text].map(c => this.encode(c.charCodeAt(0))).join("");
  },

  decodeText(encoded) {
    let i = 0, decoded = "";
    while (i < encoded.length) {
      let zeros = 0;
      while (encoded[i++] === "0") zeros++;
      const bits = encoded.slice(i - 1, i + zeros);
      decoded += String.fromCharCode(parseInt(bits, 2));//Converte o número para caractere
      i += zeros;
    }
    return decoded;
  }
};

// === FIBONACCI ===
const Fibonacci = {
  generate(max) { // gera a sequencia de fibonacci
    const seq = [1, 2];
    while (seq.at(-1) + seq.at(-2) <= max)// soma os dois ultimos numeros
      seq.push(seq.at(-1) + seq.at(-2));// pega o último elemento do array.
    return seq;
  },

  encode(num) {// codifica
    const fib = this.generate(num);
    let result = "";
    let i = fib.length - 1;
    while (i >= 0) {
      if (fib[i] <= num) {
        num -= fib[i];
        result = "1" + result;
      } else {
        result = "0" + result;
      }
      i--;
    }
    return result + "1";// sinal de parada
  },

  decode(code) {
    const fib = this.generate(1000);
    return [...code].reduce((sum, bit, i) => (
      bit === "1" && i < code.length - 1 ? sum + fib[i] : sum
    ), 0);
  },

  encodeText(text) {
    return [...text].map(c => this.encode(c.charCodeAt(0))).join("");
  },

  decodeText(encoded) {
    let decoded = "", code = "";
    for (let i = 0; i < encoded.length; i++) {
      code += encoded[i];
      if (code.endsWith("11")) {
        decoded += String.fromCharCode(this.decode(code));
        code = "";
      }
    }
    return decoded;
  }
};

// === HUFFMAN ===
class Node {
  constructor(char, freq) {
    this.char = char;
    this.freq = freq;
    this.left = this.right = null;
  }
}

const Huffman = {
  codes: {},
  treeRoot: null,

  buildTree(text) {
    const freq = [...text].reduce((acc, c) => {
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
    let nodes = Object.entries(freq).map(([char, freq]) => new Node(char, freq));//Cria um nó para cada caractere com sua frequência. 
    while (nodes.length > 1) {
      nodes.sort((a, b) => a.freq - b.freq);// Ordena os nós do menor para o maior pela frequência.
      const [left, right] = nodes.splice(0, 2);
      const merged = new Node(null, left.freq + right.freq);// Pega os dois menores (left, right), junta em um novo nó  com frequência somada.
      merged.left = left;
      merged.right = right;
      nodes.push(merged);
    }
    return nodes[0];
  },

  assignCodes(node, code = "") {
    if (!node) return;
    if (node.char !== null) this.codes[node.char] = code;
    this.assignCodes(node.left, code + "0");
    this.assignCodes(node.right, code + "1");
  },

  encode(text) {
    this.codes = {};
    this.treeRoot = this.buildTree(text);
    this.assignCodes(this.treeRoot);
    return [...text].map(c => this.codes[c]).join("");
  },

  decode(encodedText) {
    const reverse = Object.fromEntries(Object.entries(this.codes).map(([k, v]) => [v, k]));
    let code = "", result = "";
    for (const bit of encodedText) {
      code += bit;
      if (reverse[code]) {
        result += reverse[code];
        code = "";
      }
    }
    return result;
  },

  displayTree(node, indent = "") {
    if (!node) return "";
    const left = this.displayTree(node.left, indent + "  ");
    const right = this.displayTree(node.right, indent + "  ");
    const value = node.char ? `'${node.char}' (${node.freq})` : `* (${node.freq})`;
    return `${indent}${value}\n${left}${right}`;
  }
};

// === INTERFACE ===
const methods = {
  golomb: Golomb,
  elias: EliasGamma,
  fibonacci: Fibonacci,
  huffman: Huffman
};

function codificar() {
  const input = document.getElementById("input").value;
  const method = document.getElementById("method").value;

  try {
    const output = methods[method].encodeText
      ? methods[method].encodeText(input)
      : methods[method].encode(input);
    document.getElementById("output").textContent = output;

    if (method === "huffman") {
      document.getElementById("tree-title").style.display = "block";
      const tree = Huffman.displayTree(Huffman.treeRoot);
      document.getElementById("huffman-tree").textContent = tree;
    } else {
      document.getElementById("tree-title").style.display = "none";
      document.getElementById("huffman-tree").textContent = "";
    }

  } catch (e) {
    document.getElementById("output").textContent = `Erro: ${e.message}`;
  }
}

function decodificar() {
  const input = document.getElementById("input").value;
  const method = document.getElementById("method").value;

  try {
    const output = methods[method].decodeText
      ? methods[method].decodeText(input)
      : methods[method].decode(input);
    document.getElementById("output").textContent = output;
    document.getElementById("tree-title").style.display = "none";
    document.getElementById("huffman-tree").textContent = "";
  } catch (e) {
    document.getElementById("output").textContent = `Erro: ${e.message}`;
  }
}
