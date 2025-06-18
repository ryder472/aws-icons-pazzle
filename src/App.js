import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// AWSサービスアイコンの定義（色とサービス名）
const AWS_SERVICES = [
  { name: 'EC2', color: '#FF9900', symbol: '🖥️' },
  { name: 'S3', color: '#569A31', symbol: '🪣' },
  { name: 'Lambda', color: '#FF4B4B', symbol: '⚡' },
  { name: 'RDS', color: '#3F48CC', symbol: '🗄️' },
];

const BOARD_WIDTH = 6;
const BOARD_HEIGHT = 13; // 上方向に1マス追加（画面外）
const VISIBLE_HEIGHT = 12; // 実際に表示される高さ
const FALL_SPEED = 1000; // ミリ秒

function App() {
  const [board, setBoard] = useState(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chainCount, setChainCount] = useState(0);

  // ランダムなAWSサービスを生成
  const generateRandomService = () => {
    return AWS_SERVICES[Math.floor(Math.random() * AWS_SERVICES.length)];
  };

  // 新しい組ぷよを生成（2つ1組）
  const generateNewPiece = () => {
    return {
      main: generateRandomService(),    // メインぷよ（下）
      sub: generateRandomService(),     // サブぷよ（上）
      x: 2,                            // 3列目（0から数えて2）
      y: 0,                            // 最上段
      rotation: 0,                     // 0:縦(上sub下main), 1:右(左main右sub), 2:縦(上main下sub), 3:左(左sub右main)
    };
  };

  // ゲーム初期化
  const initializeGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)));
    setCurrentPiece(generateNewPiece());
    setNextPiece(generateNewPiece());
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setChainCount(0);
  };

  // 組ぷよの各ぷよの位置を取得
  const getPiecePositions = (piece) => {
    const positions = [];
    const { x, y, rotation } = piece;
    
    switch (rotation) {
      case 0: // 縦（上sub下main）
        positions.push({ x, y: y + 1, puyo: piece.main });
        positions.push({ x, y, puyo: piece.sub });
        break;
      case 1: // 右（左main右sub）
        positions.push({ x, y, puyo: piece.main });
        positions.push({ x: x + 1, y, puyo: piece.sub });
        break;
      case 2: // 縦（上main下sub）
        positions.push({ x, y: y + 1, puyo: piece.sub });
        positions.push({ x, y, puyo: piece.main });
        break;
      case 3: // 左（左sub右main）
        positions.push({ x, y, puyo: piece.sub });
        positions.push({ x: x + 1, y, puyo: piece.main });
        break;
      default:
        break;
    }
    
    return positions;
  };

  // ピースが配置可能かチェック
  const canPlacePiece = (piece, newX, newY, newRotation = piece.rotation) => {
    const testPiece = { ...piece, x: newX, y: newY, rotation: newRotation };
    const positions = getPiecePositions(testPiece);
    
    for (const pos of positions) {
      if (pos.x < 0 || pos.x >= BOARD_WIDTH || pos.y >= BOARD_HEIGHT) {
        return false;
      }
      if (pos.y >= 0 && board[pos.y][pos.x] !== null) {
        return false;
      }
    }
    return true;
  };

  // 個別のぷよを落下させる（組ぷよの各ぷよが独立して落下）
  const dropIndividualPuyo = (board, x, y, puyo) => {
    const newBoard = board.map(row => [...row]);
    
    // 現在の位置をクリア
    newBoard[y][x] = null;
    
    // 落下先を探す
    let dropY = y;
    while (dropY + 1 < BOARD_HEIGHT && newBoard[dropY + 1][x] === null) {
      dropY++;
    }
    
    // 新しい位置に配置
    newBoard[dropY][x] = puyo;
    
    return { board: newBoard, moved: dropY !== y };
  };

  // 個別のぷよを段階的に落下させる（アニメーション付き）
  const dropIndividualPuyoAnimated = async (board, positions) => {
    let currentBoard = board.map(row => [...row]);
    let totalMoved = false;
    
    // 各ぷよを配置
    for (const pos of positions) {
      if (pos.y >= 0) {
        currentBoard[pos.y][pos.x] = pos.puyo;
      }
    }
    
    // 各ぷよを個別に落下させる
    for (const pos of positions) {
      if (pos.y >= 0) {
        const result = dropIndividualPuyo(currentBoard, pos.x, pos.y, pos.puyo);
        currentBoard = result.board;
        if (result.moved) {
          totalMoved = true;
          // 落下アニメーションのための短い遅延
          setBoard([...currentBoard]);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
    
    return { board: currentBoard, moved: totalMoved };
  };

  // ピースを固定
  const placePiece = useCallback(async (piece) => {
    const positions = getPiecePositions(piece);
    
    // ゲームオーバーチェック（3列目の最上段に触れる）
    for (const pos of positions) {
      if (pos.y <= 0 && pos.x === 2) {
        setGameOver(true);
        setIsPlaying(false);
        return;
      }
    }

    // 組ぷよの各ぷよを個別に配置し、必要に応じて落下させる
    const result = await dropIndividualPuyoAnimated(board, positions);
    setBoard(result.board);

    // 次のピースを設定
    setCurrentPiece(nextPiece);
    setNextPiece(generateNewPiece());

    // 個別落下が完了してから連鎖チェックを開始
    const delay = result.moved ? 200 : 100;
    setTimeout(() => {
      checkChains(result.board, 0);
    }, delay);
  }, [board, nextPiece]);

  // 重力を適用
  const applyGravity = (currentBoard) => {
    return new Promise((resolve) => {
      let hasChanged = false;
      const newBoard = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));

      // 各列について下から詰める
      for (let x = 0; x < BOARD_WIDTH; x++) {
        let writeIndex = BOARD_HEIGHT - 1;
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
          if (currentBoard[y][x] !== null) {
            newBoard[writeIndex][x] = currentBoard[y][x];
            if (writeIndex !== y) {
              hasChanged = true;
            }
            writeIndex--;
          }
        }
      }

      setBoard(newBoard);
      
      if (hasChanged) {
        // 重力が適用された場合、再度重力をチェック
        setTimeout(() => {
          applyGravity(newBoard).then(resolve);
        }, 150);
      } else {
        // 重力が完了した場合
        setTimeout(() => resolve(newBoard), 100);
      }
    });
  };

  // 連鎖チェック
  const checkChains = async (currentBoard, currentChain) => {
    const visited = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(false));
    let hasMatches = false;
    let totalPuyoCount = 0;

    const findConnectedPuyos = (x, y, color, connected = []) => {
      if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) return connected;
      if (visited[y][x] || currentBoard[y][x] === null) return connected;
      if (currentBoard[y][x].color !== color) return connected;

      visited[y][x] = true;
      connected.push({ x, y });

      // 4方向をチェック
      findConnectedPuyos(x + 1, y, color, connected);
      findConnectedPuyos(x - 1, y, color, connected);
      findConnectedPuyos(x, y + 1, color, connected);
      findConnectedPuyos(x, y - 1, color, connected);

      return connected;
    };

    const newBoard = currentBoard.map(row => [...row]);

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (!visited[y][x] && currentBoard[y][x] !== null) {
          const connected = findConnectedPuyos(x, y, currentBoard[y][x].color);
          if (connected.length >= 4) {
            hasMatches = true;
            totalPuyoCount += connected.length;
            connected.forEach(pos => {
              newBoard[pos.y][pos.x] = null;
            });
          }
        }
      }
    }

    if (hasMatches) {
      const newChain = currentChain + 1;
      setChainCount(newChain);
      
      // 得点計算（連鎖倍率を考慮）
      const chainBonus = Math.pow(2, newChain - 1);
      const points = totalPuyoCount * 10 * chainBonus;
      setScore(prev => prev + points);

      setBoard(newBoard);
      
      // ぷよ消滅のアニメーション時間を待つ
      setTimeout(async () => {
        // 重力を適用してぷよを落下させる
        const gravityBoard = await applyGravity(newBoard);
        // 重力適用後に再度連鎖チェック
        setTimeout(() => {
          checkChains(gravityBoard, newChain);
        }, 200);
      }, 300);
    } else {
      setBoard(newBoard);
      setChainCount(0);
    }
  };

  // 組ぷよの各ぷよが個別に落下可能かチェック
  const checkIndividualFall = (piece) => {
    const positions = getPiecePositions(piece);
    let shouldPlace = false;
    
    for (const pos of positions) {
      // 各ぷよについて、下に移動できるかチェック
      if (pos.y + 1 >= BOARD_HEIGHT || 
          (pos.y + 1 >= 0 && board[pos.y + 1][pos.x] !== null)) {
        // このぷよは下に移動できない
        shouldPlace = true;
        break;
      }
    }
    
    return shouldPlace;
  };

  // ピースの移動
  const movePiece = (dx, dy) => {
    if (!currentPiece || gameOver) return;

    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;

    if (canPlacePiece(currentPiece, newX, newY)) {
      setCurrentPiece({ ...currentPiece, x: newX, y: newY });
    } else if (dy > 0) {
      // 下に移動できない場合、個別落下ルールをチェック
      if (checkIndividualFall(currentPiece)) {
        // 組ぷよのいずれかが着地したので固定
        placePiece(currentPiece);
      }
    }
  };

  // ピースの回転
  const rotatePiece = () => {
    if (!currentPiece || gameOver) return;

    const newRotation = (currentPiece.rotation + 1) % 4;
    
    if (canPlacePiece(currentPiece, currentPiece.x, currentPiece.y, newRotation)) {
      setCurrentPiece({ ...currentPiece, rotation: newRotation });
    }
  };

  // キーボード操作
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isPlaying) return;

      switch (e.key) {
        case 'ArrowLeft':
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          movePiece(0, 1);
          break;
        case 'ArrowUp':
        case ' ':
          rotatePiece();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPiece, isPlaying, gameOver]);

  // 自動落下
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const interval = setInterval(() => {
      movePiece(0, 1);
    }, FALL_SPEED);

    return () => clearInterval(interval);
  }, [currentPiece, isPlaying, gameOver]);

  // ボードの描画（上1行は非表示）
  const renderBoard = () => {
    const displayBoard = board.slice(1).map(row => [...row]); // 上1行を除外

    // 現在のピースを表示
    if (currentPiece) {
      const positions = getPiecePositions(currentPiece);
      positions.forEach(pos => {
        if (pos.y >= 1 && pos.y < BOARD_HEIGHT) {
          displayBoard[pos.y - 1][pos.x] = pos.puyo;
        }
      });
    }

    return displayBoard.map((row, y) => (
      <div key={y} className="board-row">
        {row.map((cell, x) => (
          <div
            key={x}
            className={`board-cell ${x === 2 && y === 0 ? 'danger-zone' : ''}`}
            style={{
              backgroundColor: cell ? cell.color : '#f0f0f0',
              border: '1px solid #ccc',
            }}
          >
            {cell && (
              <div className="service-icon">
                <span className="service-symbol">{cell.symbol}</span>
                <span className="service-name">{cell.name}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    ));
  };

  // NEXTぷよの表示
  const renderNextPiece = () => {
    if (!nextPiece) return null;

    return (
      <div className="next-piece-container">
        <div className="next-piece-grid">
          <div 
            className="next-puyo"
            style={{ backgroundColor: nextPiece.sub.color }}
          >
            <span>{nextPiece.sub.symbol}</span>
            <span>{nextPiece.sub.name}</span>
          </div>
          <div 
            className="next-puyo"
            style={{ backgroundColor: nextPiece.main.color }}
          >
            <span>{nextPiece.main.symbol}</span>
            <span>{nextPiece.main.name}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AWS ぷよぷよ</h1>
        <div className="game-container">
          <div className="game-info">
            <div className="score">スコア: {score}</div>
            {chainCount > 0 && (
              <div className="chain-display">{chainCount}連鎖!</div>
            )}
            <div className="next-piece">
              <h3>NEXT:</h3>
              {renderNextPiece()}
            </div>
            <div className="controls">
              <p>操作方法:</p>
              <p>← → : 移動</p>
              <p>↓ : 高速落下</p>
              <p>↑ / Space : 回転</p>
            </div>
          </div>
          
          <div className="game-board">
            {renderBoard()}
          </div>
        </div>

        <div className="game-controls">
          {!isPlaying && (
            <button onClick={initializeGame} className="start-button">
              {gameOver ? 'リスタート' : 'ゲーム開始'}
            </button>
          )}
          {gameOver && (
            <div className="game-over">
              <h2>ゲームオーバー!</h2>
              <p>最終スコア: {score}</p>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
