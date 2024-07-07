export default function Login(){
    return(
        <div>
            <form action="../auth/signin" method="post">
                <label htmlFor="email">Email</label>
                <input name="email"/>
                <label htmlFor="password">password</label>
                <input name="password"/>
                <button>Sign In</button>
            </form>
        </div>
    )
}