import Header from "../../components/Header"
import { sanityClient, urlFor } from "../../sanity"
import { Post } from "../../typings.ds";
import { GetStaticProps } from "next";
import PortableText from "react-portable-text";
import {useForm,SubmitHandler} from "react-hook-form"
import dynamic from "next/dynamic";
import { useState } from "react";

//gave all the path of the each post
export const getStaticPaths = async () => {
    const query = `*[_type=="post"]{
        _id,
        slug {
            current
        }
    }`;
    const posts = await sanityClient.fetch(query)
    
    const paths = posts.map((post:Post) => ({
        params: {
            slug:post.slug.current
        }
    }))
    return {
        paths,
        fallback:"blocking"
    }
}
//this use the slug and fetch all the information for each slug

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const query = `*[_type == "post" && slug.current==$slug][0]{
        _id,
        _createdAt,
        title,
        author-> {
            name,
            image
        },
        'comments':*[
         _type=="comment" && 
          post._ref==^._id && 
          approved==true],
    description,
    mainImage,
    slug,
    body[]{
        ..., 
    asset->{
      ...,
      "_key": _id
    }
    }


}`;
    const post = await sanityClient.fetch(query, {
        slug:params?.slug
    })
    //return 404 page
    if (!post) {
        return {
            notFound:true
        }
    }
    return {
        props: {
            post
        },
        revalidate: 60 //after 60 seconds it will update old cached version
        //it is incremental site generation technique it will in each 60 seconds site will do server side  render and cached it and after 60 seconds
        //it will do the same process 
    }
}

interface Props{
    post:Post
}
interface IFormInput{
    _id: string; //name? can also be apply for optional case
    name: string;
    email: string;
    comment: string;
}

const Post = ({post}:Props) => {
    console.log(post);
    const[submitted,setSubmitted]=useState(false)
    const {register,handleSubmit,formState:{errors}}=useForm<IFormInput>()
    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        try {
           
            const res = await fetch('/api/createComment', {
                method: "POST",
                body: JSON.stringify(data),
            })
            const res2 = await res.json()
            setSubmitted(true)
        } catch (err) {
             setSubmitted(false)
            console.log(err)
        }
        
  }
    return (
    <main>
            <Header />
            <img className="w-full h-40 object-cover" src={urlFor(post.mainImage).url()!} alt="" />
            <article className="max-w-3xl mx-auto p-5">
                <h1 className="text-3xl mt-10 mb-3">{post.title}</h1>
                <h2 className="text-xl font-light text-gray-500 mb-2">{post.description}</h2>
            <div className="flex items-center space-x-2">
                <img className="h-10 w-10 rounded-full" src={urlFor(post.author.image).url()!} alt="" />
                <p className="font-extralight text-sm">Blog post by <span className="text-green-600">{post.author.name}</span>- Published at {new Date(post._createdAt).toLocaleString()}</p>
            </div>
            <div className="mt-10">
                <PortableText
                    dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
                    projectId={process.env.NEXT_PUBLIC_PROJECT_ID!}
                    content={post.body}
                    serializers={{
                        h1: (props: any) => {
                            <h1 className="text-2xl font-bold my-5">{...props}</h1>

                        },
                        h2: (props: any) => {
                            <h1 className="text-xl font-bold my-5">{...props}</h1>

                        },
                        li: ({ children }: any) => {
                            <li className="ml-4 list-disc">{children}</li>
                        },
                        link: ({
                            href,children
                        }: any) => {
                            <a href={href} className="tet-blue-500 hover:underline">
                                {children}
                            </a>
                        }
                    }}
                />
            </div>
            </article>
            <hr className="max-w-lg my-5 mx-auto border border-yellow-500" />        
            {submitted ? (<div className="flex flex-col py-10 my-10 bg-yellow-500 text-white max-w-2xl mx-auto">
                <h3 className="text-3xl font-bold">Thank you for Submitting your component!</h3>
                <p>Once it has been approved it will appear below</p>
            </div>): (
                
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col p-5 max-w-2xl mx-auto mb-10">
                    <h3 className="text-sm text-yellow-500">Enjoyed this article</h3>
                    <h4 className="text-3xl font-bold">Leave a Comment below!</h4>
                    <hr className="py-3 mt-2" />
                    <input {...register("_id")}
                        type="hidden"
                        name="_id"
                        value={post._id}
                        />
                    <label>
                        <span className="text-grey-700">Name</span>
                        <input
                            {...register("name",{required:true})}
                            className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring"
                            placeholder="John Apple"
                            type="text" />
                        
                    </label>
                    <label>
                        <span className="text-grey-700">Email</span>
                        <input
                            {...register("email",{required:true})}
                            className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring"
                            placeholder="xyz@gmail.com"
                            type="email" />
                        
                    </label>
                    <label>
                        <span className="text-grey-700">Comment</span>
                        <textarea
                            {...register("comment",{required:true})}
                            className="shadow border rounded py-2 px-3 form textarea mt-1 block w-full ring-yellow-500 outline-none focus:ring"
                            placeholder="John Apple"
                            rows={8} />
                        
                    </label>
                    <div className="flex flex-col p-5">
                        {errors.name && (
                            <span className="text-red-500">The Name Field is required</span>
                        )}
                        
                        {errors.email && (
                            <span className="text-red-500">The Email Field is required</span>
                        )}
                        
                        {errors.comment && (
                            <span className="text-red-500">The Comment Field is required</span>
                        )}
                    </div>
                    <input type="submit" className="shadow bg-yellow-500 hover:bg-yellow-400 focus:outline-none text-white font-bold py-2 px-4 rounded cursor-pointer"/>
                </form>
            )}
            <div className="flex flex-col p-10 my-10 max-w-2xl mx-auto shadow-yellow-500 shadow space-y-2">
                <h3 className="text-4xl">Comment</h3>
                <hr className="pb-2"/>
                {post.comments.map((comment) => (
                    <div key={comment._id} className="">
                        <p><span className="text-yellow-500">{comment.name}:</span>{comment.comment}</p>
                    </div>
                ))}
            </div>
    </main>
  )
}


export default dynamic (() => Promise.resolve(Post), {ssr: false})
