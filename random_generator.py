import random

if __name__ == '__main__':
    numbers = [random.randint(1, 100) for _ in range(10)]
    print('Random numbers:', numbers)
